import type {
  Grid,
  Ship,
  ShipConfig,
  Orientation,
  CellState,
} from './types';
import {
  GRID_SIZE,
  FLEET,
  ROW_LABELS,
} from './types';

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 'empty' as CellState)
  );
}

export function canPlaceShip(
  grid: Grid,
  row: number,
  col: number,
  length: number,
  orientation: Orientation
): boolean {
  for (let i = 0; i < length; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    if (r >= GRID_SIZE || c >= GRID_SIZE) return false;
    if (grid[r][c] !== 'empty') return false;
  }
  return true;
}

export function placeShip(
  grid: Grid,
  row: number,
  col: number,
  config: ShipConfig,
  orientation: Orientation
): { grid: Grid; ship: Ship } | null {
  if (!canPlaceShip(grid, row, col, config.length, orientation)) return null;

  const newGrid = grid.map((r) => [...r]);
  const positions: [number, number][] = [];

  for (let i = 0; i < config.length; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    newGrid[r][c] = 'ship';
    positions.push([r, c]);
  }

  return {
    grid: newGrid,
    ship: {
      name: config.name,
      length: config.length,
      positions,
      hits: new Set<string>(),
      sunk: false,
    },
  };
}

export function randomPlacement(): { grid: Grid; ships: Ship[] } {
  let grid = createEmptyGrid();
  const ships: Ship[] = [];

  for (const config of FLEET) {
    let placed = false;
    while (!placed) {
      const orientation: Orientation =
        Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const result = placeShip(grid, row, col, config, orientation);
      if (result) {
        grid = result.grid;
        ships.push(result.ship);
        placed = true;
      }
    }
  }

  return { grid, ships };
}

export function fireAt(
  grid: Grid,
  ships: Ship[],
  row: number,
  col: number
): { grid: Grid; ships: Ship[]; result: 'hit' | 'miss' | 'sunk'; sunkShipName?: string } {
  const newGrid = grid.map((r) => [...r]);
  const newShips = ships.map((s) => ({
    ...s,
    hits: new Set(s.hits),
  }));

  const cell = newGrid[row][col];

  if (cell === 'ship') {
    const key = `${row},${col}`;
    for (const ship of newShips) {
      const isPartOfShip = ship.positions.some(
        ([r, c]) => r === row && c === col
      );
      if (isPartOfShip) {
        ship.hits.add(key);
        if (ship.hits.size === ship.length) {
          ship.sunk = true;
          for (const [r, c] of ship.positions) {
            newGrid[r][c] = 'sunk';
          }
          return {
            grid: newGrid,
            ships: newShips,
            result: 'sunk',
            sunkShipName: ship.name,
          };
        }
        break;
      }
    }
    newGrid[row][col] = 'hit';
    return { grid: newGrid, ships: newShips, result: 'hit' };
  }

  newGrid[row][col] = 'miss';
  return { grid: newGrid, ships: newShips, result: 'miss' };
}

export function allShipsSunk(ships: Ship[]): boolean {
  return ships.every((s) => s.sunk);
}

export function coordLabel(row: number, col: number): string {
  return `${ROW_LABELS[row]}${col + 1}`;
}

export interface AIState {
  mode: 'hunt' | 'target';
  targetQueue: [number, number][];
  hitStack: [number, number][];
}

export function createAIState(): AIState {
  return { mode: 'hunt', targetQueue: [], hitStack: [] };
}

function getAdjacentCells(
  row: number,
  col: number
): [number, number][] {
  const cells: [number, number][] = [];
  if (row > 0) cells.push([row - 1, col]);
  if (row < GRID_SIZE - 1) cells.push([row + 1, col]);
  if (col > 0) cells.push([row, col - 1]);
  if (col < GRID_SIZE - 1) cells.push([row, col + 1]);
  return cells;
}

export function aiSelectTarget(
  grid: Grid,
  aiState: AIState
): { target: [number, number]; aiState: AIState } {
  const newState = {
    ...aiState,
    targetQueue: [...aiState.targetQueue],
    hitStack: [...aiState.hitStack],
  };

  while (newState.targetQueue.length > 0) {
    const next = newState.targetQueue.shift()!;
    const [r, c] = next;
    if (grid[r][c] === 'empty' || grid[r][c] === 'ship') {
      return { target: next, aiState: newState };
    }
  }

  newState.mode = 'hunt';
  newState.hitStack = [];

  const available: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 'empty' || grid[r][c] === 'ship') {
        available.push([r, c]);
      }
    }
  }

  const idx = Math.floor(Math.random() * available.length);
  return { target: available[idx], aiState: newState };
}

export function aiProcessResult(
  aiState: AIState,
  target: [number, number],
  result: 'hit' | 'miss' | 'sunk',
  grid: Grid
): AIState {
  const newState = {
    ...aiState,
    targetQueue: [...aiState.targetQueue],
    hitStack: [...aiState.hitStack],
  };

  if (result === 'hit') {
    newState.mode = 'target';
    newState.hitStack.push(target);
    const adjacent = getAdjacentCells(target[0], target[1]);
    for (const [r, c] of adjacent) {
      const cell = grid[r][c];
      if (
        (cell === 'empty' || cell === 'ship') &&
        !newState.targetQueue.some(([qr, qc]) => qr === r && qc === c)
      ) {
        newState.targetQueue.push([r, c]);
      }
    }
  } else if (result === 'sunk') {
    newState.hitStack = [];
    newState.targetQueue = newState.targetQueue.filter(([r, c]) => {
      const cell = grid[r][c];
      return cell === 'empty' || cell === 'ship';
    });
    if (newState.targetQueue.length === 0) {
      newState.mode = 'hunt';
    }
  }

  return newState;
}
