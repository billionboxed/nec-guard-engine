import { PlacedEquipment, RoomDimensions } from './src/lib/types';
import { checkLayoutCollisions } from './src/lib/geometry';
import { getOrientedEquipmentRect, getWorkspaceRect, rectIntersect } from './src/lib/necLogic';

const room: RoomDimensions = { width: 240, length: 240, doors: [] };

const eq1: PlacedEquipment = {
  id: 'E1', name: 'SouthEq', width: 48, depth: 24, voltage: 480, wall: 'S', x: 240 - 48, y: 0, condition: 1
};

const eq2: PlacedEquipment = {
  id: 'E2', name: 'EastEq', width: 48, depth: 24, voltage: 480, wall: 'E', x: 240 - 24, y: 24, condition: 1
};

const r1 = getOrientedEquipmentRect(eq1);
const r2 = getOrientedEquipmentRect(eq2);
const ws1 = getWorkspaceRect(eq1, room, '2023');
const ws2 = getWorkspaceRect(eq2, room, '2023');

console.log("R1:", r1);
console.log("WS1:", ws1);
console.log("R2:", r2);
console.log("WS2:", ws2);

console.log("Intersect r2 with ws1:", rectIntersect(r2, ws1));
console.log("Intersect r1 with ws2:", rectIntersect(r1, ws2));

const layout = [eq1, eq2];
console.log("Layout Collision:", checkLayoutCollisions(layout, room, '2023'));
