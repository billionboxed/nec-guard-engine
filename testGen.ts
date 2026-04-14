import { PlacedEquipment, RoomDimensions, Equipment } from './src/lib/types';
import { checkLayoutCollisions } from './src/lib/geometry';
import { getWorkspaceRect, getOrientedEquipmentRect } from './src/lib/necLogic';

const room: RoomDimensions = { width: 240, length: 240, doors: [] };

const eq1: Equipment = { id: 'E1', name: 'N', width: 48, depth: 24, voltage: 480, hasDoors: true };
const eq2: Equipment = { id: 'E2', name: 'E', width: 24, depth: 24, voltage: 480, hasDoors: true };

const placedN: PlacedEquipment = { ...eq1, wall: 'N', x: 168, y: 216, condition: 3 };
const placedE: PlacedEquipment = { ...eq2, wall: 'E', x: 216, y: 192, condition: 3 };

const layout = [placedN, placedE];
console.log("Check collision returns:", checkLayoutCollisions(layout, room, '2023'));

const rN = getOrientedEquipmentRect(placedN);
const rE = getOrientedEquipmentRect(placedE);
const wsN = getWorkspaceRect(placedN, room, '2023');
const wsE = getWorkspaceRect(placedE, room, '2023');

console.log("Intersect wsE with rN:", rectIntersect(rN, wsE));
console.log("Intersect wsN with rE:", rectIntersect(rE, wsN));

