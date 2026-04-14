import { PlacedEquipment, RoomDimensions } from './src/lib/types';
import { getOrientedEquipmentRect, getWorkspaceRect, rectIntersect } from './src/lib/necLogic';

const room: RoomDimensions = { width: 240, length: 240, doors: [] };

const eqNorth: PlacedEquipment = {
  id: 'N', name: 'Switchboard N', width: 48, depth: 24, voltage: 480, wall: 'N', x: 192, y: 216, condition: 1
};

const eqEast: PlacedEquipment = {
  id: 'E', name: 'Switchboard E', width: 48, depth: 24, voltage: 480, wall: 'E', x: 216, y: 168, condition: 1
};

const rN = getOrientedEquipmentRect(eqNorth);
const wsN = getWorkspaceRect(eqNorth, room, '2023');

const rE = getOrientedEquipmentRect(eqEast);
const wsE = getWorkspaceRect(eqEast, room, '2023');

console.log("North Body:", rN);
console.log("North WS:", wsN);

console.log("East Body:", rE);
console.log("East WS:", wsE);

console.log("Intersect East Body with North WS:", rectIntersect(rE, wsN));
console.log("Intersect North Body with East WS:", rectIntersect(rN, wsE));
