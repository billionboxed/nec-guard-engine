export type WallSide = 'N' | 'S' | 'E' | 'W';
export type NecEdition = '2017' | '2020' | '2023' | '2026';

export type AffinityColor = 'bg-blue-500' | 'bg-red-500' | 'bg-emerald-500' | 'bg-purple-500' | 'bg-amber-500' | '';

export interface Equipment {
  id: string;
  name: string;
  width: number; // inches
  depth: number; // inches
  voltage: number; // e.g. 120, 208, 480, 1000
  amps?: number; // For Large Equipment checks
  hasDoors?: boolean; // Default true
  affinityColor?: AffinityColor; // Group clustering tag
}

export interface PlacedEquipment extends Equipment {
  x: number; // bottom-left x coordinate (inches)
  y: number; // bottom-left y coordinate (inches)
  wall: WallSide;
  condition: 1 | 2 | 3;
}

export interface LayoutResult {
  layout: PlacedEquipment[];
  unplaced: Equipment[];
  fitness: number;
  maxC3Violations: number;
}

export interface Door {
  wall: WallSide;
  offset: number; // distance from bottom-left origin along the assigned wall (inches)
  width: number; // inches
}

export interface RoomDimensions {
  width: number; // inches (X-axis)
  length: number; // inches (Y-axis)
  doors: Door[];
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
