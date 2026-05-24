/**
 * Internal simulation: plays 100 random Battleship games (AI vs AI)
 * and validates grid integrity, turn state, and win conditions.
 *
 * Run with: npx tsx scripts/simulate.ts
 */

import {
  createEmptyGrid,
  randomPlacement,
  fireAt,
  allShipsSunk,
  coordLabel,
  createAIState,
  aiSelectTarget,
  aiProcessResult,
} from '../src/game/engine';
import type { AIState } from '../src/game/engine';
import type { Grid, Ship } from '../src/game/types';
import { GRID_SIZE, FLEET } from '../src/game/types';

const NUM_GAMES = 100;
const MAX_TURNS = 200; // 10x10 grid = 100 cells per side, 200 total moves max
let totalErrors = 0;

function log(msg: string) {
  console.log(msg);
}

function logError(msg: string) {
  totalErrors++;
  console.error(`[ERROR] ${msg}`);
}

function validateGrid(grid: Grid, ships: Ship[], label: string, gameNum: number): void {
  // Check grid dimensions
  if (grid.length !== GRID_SIZE) {
    logError(`Game ${gameNum}: ${label} grid has ${grid.length} rows, expected ${GRID_SIZE}`);
  }
  for (let r = 0; r < grid.length; r++) {
    if (grid[r].length !== GRID_SIZE) {
      logError(`Game ${gameNum}: ${label} grid row ${r} has ${grid[r].length} cols, expected ${GRID_SIZE}`);
    }
  }

  // Count ship cells on grid vs ship positions
  // For unsunk ships: remaining 'ship' cells = positions - hits
  // For sunk ships: all positions become 'sunk' (0 'ship' cells)
  let shipCellCount = 0;
  let hitCellCount = 0;
  let sunkCellCount = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 'ship') shipCellCount++;
      if (grid[r][c] === 'hit') hitCellCount++;
      if (grid[r][c] === 'sunk') sunkCellCount++;
    }
  }
  let expectedShipCells = 0;
  let expectedHitCells = 0;
  let expectedSunkCells = 0;
  for (const ship of ships) {
    if (ship.sunk) {
      expectedSunkCells += ship.length;
    } else {
      expectedHitCells += ship.hits.size;
      expectedShipCells += ship.length - ship.hits.size;
    }
  }
  if (shipCellCount !== expectedShipCells) {
    logError(
      `Game ${gameNum}: ${label} 'ship' cell count mismatch: grid=${shipCellCount}, expected=${expectedShipCells}`
    );
  }
  if (hitCellCount !== expectedHitCells) {
    logError(
      `Game ${gameNum}: ${label} 'hit' cell count mismatch: grid=${hitCellCount}, expected=${expectedHitCells}`
    );
  }
  if (sunkCellCount !== expectedSunkCells) {
    logError(
      `Game ${gameNum}: ${label} 'sunk' cell count mismatch: grid=${sunkCellCount}, expected=${expectedSunkCells}`
    );
  }

  // Check for overlapping ship positions
  const posSet = new Set<string>();
  for (const ship of ships) {
    for (const [r, c] of ship.positions) {
      const key = `${r},${c}`;
      if (posSet.has(key)) {
        logError(`Game ${gameNum}: ${label} overlapping ship position at ${coordLabel(r, c)} (${key})`);
      }
      posSet.add(key);
    }
  }

  // Validate ship count and lengths
  if (ships.length !== FLEET.length) {
    logError(`Game ${gameNum}: ${label} has ${ships.length} ships, expected ${FLEET.length}`);
  }
  const expectedLengths = FLEET.map(f => f.length).sort().join(',');
  const actualLengths = ships.map(s => s.length).sort().join(',');
  if (expectedLengths !== actualLengths) {
    logError(`Game ${gameNum}: ${label} ship lengths [${actualLengths}] != expected [${expectedLengths}]`);
  }

  // Validate sunk state consistency
  for (const ship of ships) {
    if (ship.sunk && ship.hits.size !== ship.length) {
      logError(
        `Game ${gameNum}: ${label} ship "${ship.name}" marked sunk but hits=${ship.hits.size}, length=${ship.length}`
      );
    }
    if (!ship.sunk && ship.hits.size === ship.length) {
      logError(
        `Game ${gameNum}: ${label} ship "${ship.name}" has all hits (${ship.hits.size}/${ship.length}) but not marked sunk`
      );
    }
  }
}

function validateNoDoubleShots(firedCells: Set<string>, row: number, col: number, gameNum: number, who: string): void {
  const key = `${row},${col}`;
  if (firedCells.has(key)) {
    logError(`Game ${gameNum}: ${who} fired at ${coordLabel(row, col)} twice!`);
  }
  firedCells.add(key);
}

function simulateGame(gameNum: number): { winner: 'p1' | 'p2'; turns: number } {
  // Setup: both sides place randomly
  const p1Setup = randomPlacement();
  const p2Setup = randomPlacement();

  let p1Grid: Grid = p1Setup.grid;
  let p1Ships: Ship[] = p1Setup.ships;
  let p2Grid: Grid = p2Setup.grid;
  let p2Ships: Ship[] = p2Setup.ships;

  // Validate initial placement
  validateGrid(p1Grid, p1Ships, 'P1-initial', gameNum);
  validateGrid(p2Grid, p2Ships, 'P2-initial', gameNum);

  let p1AiState: AIState = createAIState();
  let p2AiState: AIState = createAIState();

  const p1FiredCells = new Set<string>();
  const p2FiredCells = new Set<string>();

  let currentTurn: 'p1' | 'p2' = 'p1';
  let turnCount = 0;

  while (turnCount < MAX_TURNS) {
    turnCount++;

    if (currentTurn === 'p1') {
      // P1 fires at P2's grid
      const { target, aiState: newState } = aiSelectTarget(p2Grid, p1AiState);
      const [r, c] = target;
      validateNoDoubleShots(p1FiredCells, r, c, gameNum, 'P1');

      const result = fireAt(p2Grid, p2Ships, r, c);
      p2Grid = result.grid;
      p2Ships = result.ships;

      p1AiState = aiProcessResult(newState, target, result.result, p2Grid);

      if (allShipsSunk(p2Ships)) {
        // Validate final state
        validateGrid(p2Grid, p2Ships, 'P2-final', gameNum);
        const unsunkP2 = p2Ships.filter(s => !s.sunk);
        if (unsunkP2.length > 0) {
          logError(
            `Game ${gameNum}: allShipsSunk=true but P2 has unsunk ships: ${unsunkP2.map(s => s.name).join(', ')}`
          );
        }
        return { winner: 'p1', turns: turnCount };
      }

      currentTurn = 'p2';
    } else {
      // P2 fires at P1's grid
      const { target, aiState: newState } = aiSelectTarget(p1Grid, p2AiState);
      const [r, c] = target;
      validateNoDoubleShots(p2FiredCells, r, c, gameNum, 'P2');

      const result = fireAt(p1Grid, p1Ships, r, c);
      p1Grid = result.grid;
      p1Ships = result.ships;

      p2AiState = aiProcessResult(newState, target, result.result, p1Grid);

      if (allShipsSunk(p1Ships)) {
        // Validate final state
        validateGrid(p1Grid, p1Ships, 'P1-final', gameNum);
        const unsunkP1 = p1Ships.filter(s => !s.sunk);
        if (unsunkP1.length > 0) {
          logError(
            `Game ${gameNum}: allShipsSunk=true but P1 has unsunk ships: ${unsunkP1.map(s => s.name).join(', ')}`
          );
        }
        return { winner: 'p2', turns: turnCount };
      }

      currentTurn = 'p1';
    }
  }

  // If we get here, game didn't finish in MAX_TURNS
  logError(`Game ${gameNum}: did not finish within ${MAX_TURNS} turns! Turn state stuck.`);
  validateGrid(p1Grid, p1Ships, 'P1-stuck', gameNum);
  validateGrid(p2Grid, p2Ships, 'P2-stuck', gameNum);
  return { winner: 'p1', turns: turnCount };
}

// --- Main ---
log(`=== Battleship Simulation: ${NUM_GAMES} games ===\n`);

let p1Wins = 0;
let p2Wins = 0;
const turnCounts: number[] = [];

for (let i = 1; i <= NUM_GAMES; i++) {
  const result = simulateGame(i);
  turnCounts.push(result.turns);
  if (result.winner === 'p1') p1Wins++;
  else p2Wins++;

  if (i % 25 === 0) {
    log(`  ... completed ${i}/${NUM_GAMES} games`);
  }
}

const avgTurns = (turnCounts.reduce((a, b) => a + b, 0) / turnCounts.length).toFixed(1);
const minTurns = Math.min(...turnCounts);
const maxTurns = Math.max(...turnCounts);

log(`\n=== Results ===`);
log(`Games played: ${NUM_GAMES}`);
log(`P1 wins: ${p1Wins} | P2 wins: ${p2Wins}`);
log(`Turns — avg: ${avgTurns}, min: ${minTurns}, max: ${maxTurns}`);
log(`Total errors: ${totalErrors}`);

if (totalErrors === 0) {
  log(`\nAll ${NUM_GAMES} games completed with zero errors.`);
} else {
  log(`\n${totalErrors} error(s) found! Review logs above.`);
  process.exit(1);
}
