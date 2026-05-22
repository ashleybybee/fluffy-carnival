import type { CellState, Orientation, Ship, ShipConfig } from './types';
import { BOARD_SIZE, SHIP_CONFIGS } from './types';

export type Board = CellState[][];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from<CellState>({ length: BOARD_SIZE }).fill('empty')
  );
}

export function canPlaceShip(
  board: Board,
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): boolean {
  for (let i = 0; i < size; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    if (r >= BOARD_SIZE || c >= BOARD_SIZE) return false;
    if (board[r][c] !== 'empty') return false;
  }
  return true;
}

export function placeShip(
  board: Board,
  row: number,
  col: number,
  size: number,
  orientation: Orientation,
  config: ShipConfig
): { board: Board; ship: Ship } | null {
  if (!canPlaceShip(board, row, col, size, orientation)) return null;

  const newBoard = board.map((r) => [...r]);
  const positions: [number, number][] = [];

  for (let i = 0; i < size; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    newBoard[r][c] = 'ship';
    positions.push([r, c]);
  }

  return {
    board: newBoard,
    ship: { name: config.name, size: config.size, positions, hits: new Set() },
  };
}

export function fireAt(
  board: Board,
  ships: Ship[],
  row: number,
  col: number
): { board: Board; result: 'hit' | 'miss' | 'already' } {
  const cell = board[row][col];
  if (cell === 'hit' || cell === 'miss') return { board, result: 'already' };

  const newBoard = board.map((r) => [...r]);
  const key = `${row},${col}`;

  if (cell === 'ship') {
    newBoard[row][col] = 'hit';
    for (const ship of ships) {
      if (ship.positions.some(([r, c]) => r === row && c === col)) {
        ship.hits.add(key);
        break;
      }
    }
    return { board: newBoard, result: 'hit' };
  }

  newBoard[row][col] = 'miss';
  return { board: newBoard, result: 'miss' };
}

export function allShipsSunk(ships: Ship[]): boolean {
  return ships.every((ship) => ship.hits.size === ship.size);
}

export function placeShipsRandomly(): { board: Board; ships: Ship[] } {
  let board = createEmptyBoard();
  const ships: Ship[] = [];

  for (const config of SHIP_CONFIGS) {
    let placed = false;
    while (!placed) {
      const orientation: Orientation =
        Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      const result = placeShip(board, row, col, config.size, orientation, config);
      if (result) {
        board = result.board;
        ships.push(result.ship);
        placed = true;
      }
    }
  }

  return { board, ships };
}

// --- AI Logic ---

interface AiState {
  huntTargets: [number, number][];
  lastHit: [number, number] | null;
}

export function createAiState(): AiState {
  return { huntTargets: [], lastHit: null };
}

function getAdjacentCells(row: number, col: number): [number, number][] {
  const adj: [number, number][] = [];
  if (row > 0) adj.push([row - 1, col]);
  if (row < BOARD_SIZE - 1) adj.push([row + 1, col]);
  if (col > 0) adj.push([row, col - 1]);
  if (col < BOARD_SIZE - 1) adj.push([row, col + 1]);
  return adj;
}

function isUnfired(board: Board, row: number, col: number): boolean {
  const cell = board[row][col];
  return cell === 'empty' || cell === 'ship';
}

export function aiMove(
  board: Board,
  aiState: AiState
): { row: number; col: number } {
  // Hunt mode: target adjacent cells of previous hits
  while (aiState.huntTargets.length > 0) {
    const target = aiState.huntTargets.pop()!;
    if (isUnfired(board, target[0], target[1])) {
      return { row: target[0], col: target[1] };
    }
  }

  // Random mode: pick a random unfired cell (checkerboard pattern for efficiency)
  const candidates: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isUnfired(board, r, c) && (r + c) % 2 === 0) {
        candidates.push([r, c]);
      }
    }
  }
  if (candidates.length === 0) {
    // Fallback: pick any unfired cell
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (isUnfired(board, r, c)) {
          candidates.push([r, c]);
        }
      }
    }
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { row: pick[0], col: pick[1] };
}

export function updateAiState(
  aiState: AiState,
  board: Board,
  row: number,
  col: number,
  result: 'hit' | 'miss'
): void {
  if (result === 'hit') {
    aiState.lastHit = [row, col];
    const adj = getAdjacentCells(row, col);
    for (const [r, c] of adj) {
      if (isUnfired(board, r, c)) {
        aiState.huntTargets.push([r, c]);
      }
    }
  }
}
