import type { Equipment, PlacedEquipment, RoomDimensions, WallSide, NecEdition, LayoutResult } from './types';
import { checkLayoutCollisions, calculateFitness, updateConditionsAndEvaluate } from './geometry';

export interface SolverResult {
  layout: PlacedEquipment[];
  unplaced: Equipment[];
  score: number;
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomLayout(room: RoomDimensions, equipmentList: Equipment[], edition: NecEdition): LayoutResult {
  let layout: PlacedEquipment[] = [];
  const unplaced: Equipment[] = [];
  const walls: WallSide[] = ['N', 'S', 'E', 'W'];

  for (const eq of equipmentList) {
    let placed = false;

    for (let attempts = 0; attempts < 50; attempts++) {
      const wall = walls[getRandomInt(0, 3)];
      let x = 0;
      let y = 0;

      if (wall === 'N') {
        x = getRandomInt(0, Math.max(0, room.width - eq.width));
        y = room.length - eq.depth;
      } else if (wall === 'S') {
        x = getRandomInt(0, Math.max(0, room.width - eq.width));
        y = 0;
      } else if (wall === 'E') {
        x = room.width - eq.depth;
        y = getRandomInt(0, Math.max(0, room.length - eq.width));
      } else if (wall === 'W') {
        x = 0;
        y = getRandomInt(0, Math.max(0, room.length - eq.width));
      }

      const tempEq: PlacedEquipment = { ...eq, x, y, wall, condition: 1 };
      
      const tempLayout = updateConditionsAndEvaluate([...layout, tempEq]);
      const valid = !checkLayoutCollisions(tempLayout, room, edition);
      
      if (valid) {
        placed = true;
        // Keep the completely evaluated tempLayout because previous items may have also mutated to Condition 3!
        layout = tempLayout;
        break; 
      }
    }
    
    if (!placed) {
      unplaced.push(eq);
    }
  }

  // Double check conditions finally, though it's now mathematically sealed
  const updatedLayout = updateConditionsAndEvaluate(layout);
  const fitness = calculateFitness(updatedLayout, room, edition);

  return { layout: updatedLayout, unplaced, fitness, maxC3Violations: 0 };
}

export function runTurboSolver(
  equipment: Equipment[],
  room: RoomDimensions,
  edition: NecEdition,
  onProgress: (progress: number) => void,
  onComplete: (result: SolverResult | null) => void
) {
  const TOTAL_ITERATIONS = 5000;
  const BATCH_SIZE = 100;
  
  let bestResult: LayoutResult | null = null;
  let currentIteration = 0;

  function processBatch() {
    try {
      const end = Math.min(currentIteration + BATCH_SIZE, TOTAL_ITERATIONS);
      
      for (let i = currentIteration; i < end; i++) {
        const result = generateRandomLayout(room, equipment, edition);
        
        if (!bestResult) {
          bestResult = result;
        } else {
          if (result.unplaced.length < bestResult.unplaced.length) {
            bestResult = result;
          } else if (result.unplaced.length === bestResult.unplaced.length) {
            if (result.fitness > bestResult.fitness) {
              bestResult = result;
            }
          }
        }
      }

      currentIteration = end;
      onProgress(currentIteration / TOTAL_ITERATIONS);

      if (currentIteration < TOTAL_ITERATIONS) {
        setTimeout(processBatch, 0);
      } else {
        onComplete(bestResult ? { layout: bestResult.layout, unplaced: bestResult.unplaced, score: bestResult.fitness } : null);
      }
    } catch (error) {
      console.error("Turbo Solver crashed mid-flight:", error);
      onComplete(bestResult ? { layout: bestResult.layout, unplaced: bestResult.unplaced, score: bestResult.fitness } : null);
    }
  }

  setTimeout(processBatch, 0);
}
