import type { PlacedEquipment, Rect, RoomDimensions, WallSide, NecEdition } from './types';
import { getOrientedEquipmentRect, getWorkspaceRect, rectIntersect, getDoorRect, getEquipmentClearanceRect, getEquipmentDoorWidth } from './necLogic';

// Dynamic Egress Array Generator
export function getEgressPaths(room: RoomDimensions): Rect[] {
  const paths: Rect[] = [];
  const centerX = room.width / 2;
  const aisleWidth = 24;

  const hasDoorN = room.doors && room.doors.some(d => d.wall === 'N');
  const hasDoorS = room.doors && room.doors.some(d => d.wall === 'S');

  // Shrink the spine away from dead walls (48") to allow equipment placement under the NEC definition of working space connection
  const startY = hasDoorS ? 0 : 48;
  const endY = hasDoorN ? room.length : room.length - 48;

  // Main Central Spine
  paths.push({
    x: centerX - aisleWidth / 2,
    y: startY,
    w: aisleWidth,
    h: endY - startY,
  });

  if (!room.doors) return paths;

  // Door Branches (L-shape / T-shape intersection nodes)
  for (const door of room.doors) {
    if (door.wall === 'S') {
      const doorCenterX = door.offset + door.width / 2;
      const xStart = Math.min(doorCenterX, centerX);
      const xEnd = Math.max(doorCenterX, centerX);
      paths.push({
        x: xStart,
        y: 0,
        w: xEnd - xStart,
        h: aisleWidth,
      });
    } else if (door.wall === 'N') {
      const doorCenterX = door.offset + door.width / 2;
      const xStart = Math.min(doorCenterX, centerX);
      const xEnd = Math.max(doorCenterX, centerX);
      paths.push({
        x: xStart,
        y: room.length - aisleWidth,
        w: xEnd - xStart,
        h: aisleWidth,
      });
    } else if (door.wall === 'E') {
      const doorCenterY = door.offset + door.width / 2;
      paths.push({
        x: centerX + aisleWidth / 2,
        y: doorCenterY - aisleWidth / 2,
        w: room.width / 2 - aisleWidth / 2,
        h: aisleWidth,
      });
    } else if (door.wall === 'W') {
      const doorCenterY = door.offset + door.width / 2;
      paths.push({
        x: 0,
        y: doorCenterY - aisleWidth / 2,
        w: centerX - aisleWidth / 2,
        h: aisleWidth,
      });
    }
  }

  return paths;
}

export function checkLayoutCollisions(layout: PlacedEquipment[], room: RoomDimensions, edition: NecEdition = '2023'): boolean {
  const egressPaths = getEgressPaths(room);
  
  for (let i = 0; i < layout.length; i++) {
    const eq1 = layout[i];
    const r1 = getOrientedEquipmentRect(eq1);
    const r1Clearance = getEquipmentClearanceRect(eq1, 1); // 1" on each side = 2" total gap

    // Egress check (Loops over entire path network)
    for (const p of egressPaths) {
      if (rectIntersect(r1, p)) return true;
    }

    // Door check: equipment body and workspace cannot intersect door swing
    const validDoors = room.doors || ((room as any).door ? [(room as any).door] : []);
    for (const door of validDoors) {
      const doorRect = getDoorRect(door, room);
      if (rectIntersect(r1, doorRect)) return true;
      const ws1 = getWorkspaceRect(eq1, room, edition);
      if (rectIntersect(ws1, doorRect)) return true;
    }

    // Equipment out of room bounds check
    if (r1.x < 0 || r1.x + r1.w > room.width || r1.y < 0 || r1.y + r1.h > room.length) {
      return true;
    }

    for (let j = i + 1; j < layout.length; j++) {
      const eq2 = layout[j];
      const r2Clearance = getEquipmentClearanceRect(eq2, 1);

      // Body-to-body collision with 2" clearance buffer (1" + 1")
      if (rectIntersect(r1Clearance, r2Clearance)) return true;

      // Body-to-Workspace collision: forbidden
      const ws2 = getWorkspaceRect(eq2, room, edition);

      const ws1 = getWorkspaceRect(eq1, room, edition);
      if (rectIntersect(r1, ws2)) return true;
      const r2 = getOrientedEquipmentRect(eq2);
      if (rectIntersect(r2, ws1)) return true;

      // 2023+ Open Door Impedance logic: if facing each other, total gap must hold open doors + 24"
      if ((edition === '2023' || edition === '2026') && eq1.wall !== eq2.wall) {
        if ((eq1.wall === 'N' && eq2.wall === 'S') || (eq1.wall === 'S' && eq2.wall === 'N')) {
          const overlapX = Math.max(0, Math.min(eq1.x + eq1.width, eq2.x + eq2.width) - Math.max(eq1.x, eq2.x));
          if (overlapX > 0) {
            const door1 = getEquipmentDoorWidth(eq1);
            const door2 = getEquipmentDoorWidth(eq2);
            const gap = room.length - eq1.depth - eq2.depth;
            if (gap < door1 + door2 + 24) return true;
          }
        }
        if ((eq1.wall === 'E' && eq2.wall === 'W') || (eq1.wall === 'W' && eq2.wall === 'E')) {
          const overlapY = Math.max(0, Math.min(eq1.y + eq1.width, eq2.y + eq2.width) - Math.max(eq1.y, eq2.y));
          if (overlapY > 0) {
            const door1 = getEquipmentDoorWidth(eq1);
            const door2 = getEquipmentDoorWidth(eq2);
            const gap = room.width - eq1.depth - eq2.depth;
            if (gap < door1 + door2 + 24) return true;
          }
        }
      }
    }
  }

  return false;
}

export function updateConditionsAndEvaluate(layout: PlacedEquipment[]): PlacedEquipment[] {
  // Deep clone so we can mutate and return
  const newLayout = JSON.parse(JSON.stringify(layout)) as PlacedEquipment[];

  // Dynamic Condition 3 check: if ws of Gear A on opposite wall intersects ws of Gear B, both get Condition 3.
  for (let i = 0; i < newLayout.length; i++) {
    for (let j = i + 1; j < newLayout.length; j++) {
      const eq1 = newLayout[i];
      const eq2 = newLayout[j];

      const isOpposite = (eq1.wall === 'N' && eq2.wall === 'S') || (eq1.wall === 'S' && eq2.wall === 'N') || 
                         (eq1.wall === 'E' && eq2.wall === 'W') || (eq1.wall === 'W' && eq2.wall === 'E');
      
      // If equipment is on opposite walls, we must check if they are facing each other physically (parallel overlap).
      // Even if the room is massively wide, NEC classifies gear facing each other across the aisle as Condition 3.
      if (isOpposite) {
        let facesEachOther = false;
        
        if (eq1.wall === 'N' || eq1.wall === 'S') {
          // Compare X bounds mapping. (Standard width)
          const overlapX = Math.max(0, Math.min(eq1.x + eq1.width, eq2.x + eq2.width) - Math.max(eq1.x, eq2.x));
          if (overlapX > 0) facesEachOther = true;
        } else {
          // Compare Y bounds mapping. (East/West width physically flows along the Y-axis)
          const overlapY = Math.max(0, Math.min(eq1.y + eq1.width, eq2.y + eq2.width) - Math.max(eq1.y, eq2.y));
          if (overlapY > 0) facesEachOther = true;
        }
        
        if (facesEachOther) {
          newLayout[i].condition = 3;
          newLayout[j].condition = 3;
        }
      }
    }
  }

  return newLayout;
}

export function calculateFitness(layout: PlacedEquipment[], room: RoomDimensions, edition: NecEdition = '2023'): number {
  if (checkLayoutCollisions(layout, room, edition)) {
    return -999999; // Invalid layout
  }

  let score = 0;
  for (const eq of layout) {
    // +10,000 for successfully placed (implicit if it returns a score)
    score += 10000;

    // -1,200 for Condition 3
    if (eq.condition === 3) {
      score -= 1200;
    }

    // -1 for every inch an item is away from a corner to gently pull clusters to corners
    let distToCorner = 0;
    if (eq.wall === 'N' || eq.wall === 'S') {
      distToCorner = Math.min(eq.x, room.width - (eq.x + eq.width));
    } else {
      distToCorner = Math.min(eq.y, room.length - (eq.y + eq.width));
    }
    score -= distToCorner; // Gentle pull to corner
  }

  // Count how many distinct walls are used. Penalize strongly to force all gear onto fewer walls!
  const usedWalls = new Set(layout.map(e => e.wall));
  score -= (usedWalls.size * 5000); // Massive penalty for spreading across the room

  // Heavy penalty for the "wasted gaps" between equipment on the same wall. 
  const walls: WallSide[] = ['N', 'S', 'E', 'W'];
  for (const w of walls) {
    const wallEqs = layout.filter(e => e.wall === w);
    if (wallEqs.length > 1) {
      if (w === 'N' || w === 'S') {
        const minX = Math.min(...wallEqs.map(e => e.x));
        const maxX = Math.max(...wallEqs.map(e => getOrientedEquipmentRect(e).x + getOrientedEquipmentRect(e).w));
        const span = maxX - minX;
        const sumEquipWidths = wallEqs.reduce((sum, e) => sum + getOrientedEquipmentRect(e).w, 0);
        const wastedGap = span - sumEquipWidths;
        score -= (wastedGap * 100); // Punish empty space between equipment on same wall
      } else {
        const minY = Math.min(...wallEqs.map(e => e.y));
        const maxY = Math.max(...wallEqs.map(e => getOrientedEquipmentRect(e).y + getOrientedEquipmentRect(e).h));
        const span = maxY - minY;
        const sumEquipWidths = wallEqs.reduce((sum, e) => sum + getOrientedEquipmentRect(e).h, 0);
        const wastedGap = span - sumEquipWidths;
        score -= (wastedGap * 100); // Punish empty space between equipment on same wall
      }
    }
  }

  // Phase 9: Affinity Grouping Penalties
  const affinityGroups = new Map<string, PlacedEquipment[]>();
  for (const eq of layout) {
    if (eq.affinityColor) {
      if (!affinityGroups.has(eq.affinityColor)) affinityGroups.set(eq.affinityColor, []);
      affinityGroups.get(eq.affinityColor)!.push(eq);
    }
  }

  for (const groupList of affinityGroups.values()) {
    if (groupList.length > 1) {
      let minX = groupList[0].x, maxX = groupList[0].x;
      let minY = groupList[0].y, maxY = groupList[0].y;
      
      for (const eq of groupList) {
        const rect = getOrientedEquipmentRect(eq);
        if (rect.x < minX) minX = rect.x;
        if (rect.x + rect.w > maxX) maxX = rect.x + rect.w;
        if (rect.y < minY) minY = rect.y;
        if (rect.y + rect.h > maxY) maxY = rect.y + rect.h;
      }
      
      const boundingBoxSpan = Math.max(maxX - minX, maxY - minY);
      // Massive penalty: 200 points per inch of group spread to pull them tightly together
      score -= (boundingBoxSpan * 200);
    }
  }

  return score;
}
