export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export type Orientation = 'horizontal' | 'vertical';

export interface Ship {
  name: string;
  length: number;
  positions: [number, number][];
  hits: Set<string>;
  sunk: boolean;
}

export interface ShipConfig {
  name: string;
  length: number;
}

export const FLEET: ShipConfig[] = [
  { name: 'Carrier', length: 5 },
  { name: 'Battleship', length: 4 },
  { name: 'Destroyer', length: 3 },
  { name: 'Submarine', length: 3 },
  { name: 'Patrol Boat', length: 2 },
];

export const GRID_SIZE = 10;
export const ROW_LABELS = 'ABCDEFGHIJ'.split('');

export type Grid = CellState[][];

export interface LogEntry {
  message: string;
  type: 'hit' | 'miss' | 'sunk' | 'info' | 'win';
}

export type GamePhase = 'setup' | 'battle' | 'gameover';
export type Turn = 'player' | 'ai';
