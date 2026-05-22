export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export type Orientation = 'horizontal' | 'vertical';

export interface Ship {
  name: string;
  size: number;
  positions: [number, number][];
  hits: Set<string>;
}

export interface ShipConfig {
  name: string;
  size: number;
}

export const SHIP_CONFIGS: ShipConfig[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];

export const BOARD_SIZE = 10;

export type Phase = 'placement' | 'playing' | 'gameOver';

export type Winner = 'player' | 'ai' | null;
