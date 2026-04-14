import type { PlacedEquipment, Rect, Equipment, RoomDimensions, Door, NecEdition } from './types';

// Width is max(30, eq.width)
export function getRequiredWorkspaceWidth(eq: Equipment): number {
  return Math.max(30, eq.width);
}

export function isLargeEquipment(eq: Equipment, edition: NecEdition): boolean {
  if (eq.amps === undefined) return false;
  const threshold = edition === '2017' ? 1200 : 800;
  return eq.amps >= threshold && eq.width >= 72;
}

export function getWorkspaceDepth(voltage: number, condition: 1 | 2 | 3, edition: NecEdition = '2023', eq?: Equipment, doorsCount: number = 1): number {
  let baseDepth = 36;
  
  if (voltage > 600 && (edition === '2020' || edition === '2023' || edition === '2026')) {
    if (condition === 1) baseDepth = 36;
    else if (condition === 2) baseDepth = 48;
    else baseDepth = 60;
  } else if (voltage > 150) {
    if (condition === 1) baseDepth = 36;
    else if (condition === 2) baseDepth = 42;
    else baseDepth = 48;
  } else {
    baseDepth = 36;
  }

  // Large equipment heuristic (requires double working space depth if limited egress)
  if (eq && isLargeEquipment(eq, edition) && doorsCount < 2) {
    baseDepth *= 2; 
  }
  
  return baseDepth;
}

export function getEquipmentRect(eq: PlacedEquipment): Rect {
  return {
    x: eq.x,
    y: eq.y,
    w: eq.width,
    h: eq.depth, // This is relative. Wait, if placed on East/West, width/depth flip visually?
    // Let's standardise: x, y is the bottom-left coordinate.
    // If placed on N/S wall: w = width, h = depth.
    // If placed on E/W wall: w = depth, h = width.
  };
}

// Adjusts the x/y of workspace to shift into room bounds if needed (e.g., corner).
export function getWorkspaceRect(eq: PlacedEquipment, room: RoomDimensions, edition: NecEdition = '2023'): Rect {
  const doorsCount = room.doors ? room.doors.length : ((room as any).door ? 1 : 0);
  const wsDepth = getWorkspaceDepth(eq.voltage, eq.condition, edition, eq, doorsCount);
  const reqConfWidth = getRequiredWorkspaceWidth(eq);

  let wx = eq.x;
  let wy = eq.y;
  let ww = reqConfWidth;
  let wh = wsDepth;

  if (eq.wall === 'N') { // Top
    wh = wsDepth;
    ww = reqConfWidth;
    wy = eq.y - wsDepth; // extends down
    // Center it on equipment:
    wx = eq.x + eq.width / 2 - ww / 2;
  } else if (eq.wall === 'S') { // Bottom
    wh = wsDepth;
    ww = reqConfWidth;
    wy = eq.y + eq.depth; // extends up
    wx = eq.x + eq.width / 2 - ww / 2;
  } else if (eq.wall === 'E') { // Right
    ww = wsDepth;
    wh = reqConfWidth;
    wx = eq.x - wsDepth; // extends left
    // Center it on equipment (which is rotated, so eq height is eq.width):
    wy = eq.y + eq.width / 2 - wh / 2;
  } else if (eq.wall === 'W') { // Left
    ww = wsDepth;
    wh = reqConfWidth;
    wx = eq.x + eq.depth; // extends right
    wy = eq.y + eq.width / 2 - wh / 2;
  }

  // Shift if out of bounds (Corner logic)
  if (wx < 0) wx = 0;
  if (wy < 0) wy = 0;
  if (wx + ww > room.width) wx = room.width - ww;
  if (wy + wh > room.length) wy = room.length - wh;

  return { x: wx, y: wy, w: ww, h: wh };
}

export function getOrientedEquipmentRect(eq: PlacedEquipment): Rect {
  const isHorizontal = eq.wall === 'N' || eq.wall === 'S';
  const width = isHorizontal ? eq.width : eq.depth;
  const height = isHorizontal ? eq.depth : eq.width;
  return { x: eq.x, y: eq.y, w: width, h: height };
}

export function getEquipmentClearanceRect(eq: PlacedEquipment, clearance: number): Rect {
  const isHorizontal = eq.wall === 'N' || eq.wall === 'S';
  const width = isHorizontal ? eq.width + clearance * 2 : eq.depth;
  const height = isHorizontal ? eq.depth : eq.width + clearance * 2;
  const x = isHorizontal ? eq.x - clearance : eq.x;
  const y = isHorizontal ? eq.y : eq.y - clearance;
  return { x, y, w: width, h: height };
}

export function getDoorRect(door: Door, room: RoomDimensions): Rect {
  if (door.wall === 'N') {
    return { x: door.offset, y: room.length - door.width, w: door.width, h: door.width };
  } else if (door.wall === 'S') {
    return { x: door.offset, y: 0, w: door.width, h: door.width };
  } else if (door.wall === 'E') {
    return { x: room.width - door.width, y: door.offset, w: door.width, h: door.width };
  } else {
    return { x: 0, y: door.offset, w: door.width, h: door.width };
  }
}

export function rectIntersect(r1: Rect, r2: Rect): boolean {
  return !(
    r2.x >= r1.x + r1.w ||
    r2.x + r2.w <= r1.x ||
    r2.y >= r1.y + r1.h ||
    r2.y + r2.h <= r1.y
  );
}

export interface DoorSwing {
  rect: Rect;
  sweepCorner: 'TL' | 'TR' | 'BL' | 'BR';
}

export function getEquipmentDoorWidth(eq: Equipment): number {
  if (eq.hasDoors === false) return 0;
  return eq.width / Math.ceil(eq.width / 36);
}

export function getDoorsForEquipment(eq: PlacedEquipment, edition: NecEdition): DoorSwing[] {
  if (eq.hasDoors === false || (edition !== '2023' && edition !== '2026')) return [];
  
  const numDoors = Math.ceil(eq.width / 36);
  if (numDoors === 0) return [];
  const dWidth = eq.width / numDoors;
  
  const doors: DoorSwing[] = [];
  
  for (let i = 0; i < numDoors; i++) {
    let rect: Rect;
    let sweep: 'TL' | 'TR' | 'BL' | 'BR';
    
    // If 2 doors (French doors), the second door (i=1) hinges on the opposite side
    const isOpposite = (numDoors === 2 && i === 1);
    
    if (eq.wall === 'N') {
      rect = { x: eq.x + i * dWidth, y: eq.y - dWidth, w: dWidth, h: dWidth };
      sweep = isOpposite ? 'BL' : 'BR';
    } else if (eq.wall === 'S') {
      rect = { x: eq.x + i * dWidth, y: eq.y + eq.depth, w: dWidth, h: dWidth };
      sweep = isOpposite ? 'TL' : 'TR';
    } else if (eq.wall === 'E') {
      rect = { x: eq.x - dWidth, y: eq.y + i * dWidth, w: dWidth, h: dWidth };
      sweep = isOpposite ? 'BL' : 'TL';
    } else { // 'W'
      rect = { x: eq.x + eq.depth, y: eq.y + i * dWidth, w: dWidth, h: dWidth };
      sweep = isOpposite ? 'BR' : 'TR';
    }
    
    doors.push({ rect, sweepCorner: sweep });
  }
  
  return doors;
}

