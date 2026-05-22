import { useState, useCallback } from 'react';
import type { Orientation, ShipConfig } from '../types';
import { BOARD_SIZE, SHIP_CONFIGS } from '../types';
import type { Board as BoardType } from '../gameLogic';
import { createEmptyBoard, placeShip, canPlaceShip } from '../gameLogic';
import type { Ship } from '../types';


interface ShipPlacementProps {
  onComplete: (board: BoardType, ships: Ship[]) => void;
}

export default function ShipPlacement({ onComplete }: ShipPlacementProps) {
  const [board, setBoard] = useState<BoardType>(createEmptyBoard);
  const [ships, setShips] = useState<Ship[]>([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverCells, setHoverCells] = useState<Set<string>>(new Set());

  const currentConfig: ShipConfig | undefined = SHIP_CONFIGS[currentShipIndex];
  const allPlaced = currentShipIndex >= SHIP_CONFIGS.length;

  const handleCellHover = useCallback(
    (row: number, col: number) => {
      if (!currentConfig) return;
      const cells = new Set<string>();
      const valid = canPlaceShip(board, row, col, currentConfig.size, orientation);
      for (let i = 0; i < currentConfig.size; i++) {
        const r = orientation === 'vertical' ? row + i : row;
        const c = orientation === 'horizontal' ? col + i : col;
        if (r < BOARD_SIZE && c < BOARD_SIZE) {
          cells.add(`${r},${c}`);
        }
      }
      if (!valid) cells.clear();
      setHoverCells(cells);
    },
    [board, currentConfig, orientation]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!currentConfig) return;
      const result = placeShip(
        board,
        row,
        col,
        currentConfig.size,
        orientation,
        currentConfig
      );
      if (!result) return;
      setBoard(result.board);
      setShips((prev) => [...prev, result.ship]);
      setCurrentShipIndex((prev) => prev + 1);
      setHoverCells(new Set());
    },
    [board, currentConfig, orientation]
  );

  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard());
    setShips([]);
    setCurrentShipIndex(0);
    setHoverCells(new Set());
  }, []);

  const toggleOrientation = useCallback(() => {
    setOrientation((prev) =>
      prev === 'horizontal' ? 'vertical' : 'horizontal'
    );
  }, []);

  return (
    <div className="placement-phase">
      <h2>Place Your Ships</h2>
      <div className="placement-controls">
        {!allPlaced && currentConfig && (
          <div className="placement-info">
            <span className="ship-name">
              {currentConfig.name} ({currentConfig.size} cells)
            </span>
            <button className="btn btn-secondary" onClick={toggleOrientation}>
              {orientation === 'horizontal' ? '↔ Horizontal' : '↕ Vertical'}
            </button>
          </div>
        )}
        <div className="placement-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
          {allPlaced && (
            <button
              className="btn btn-primary"
              onClick={() => onComplete(board, ships)}
            >
              Start Game
            </button>
          )}
        </div>
      </div>
      <div
        className="board-container"
        onMouseLeave={() => setHoverCells(new Set())}
      >
        <div
          className="board-grid"
          onMouseLeave={() => setHoverCells(new Set())}
        >
          <div className="label corner" />
          {Array.from({ length: BOARD_SIZE }, (_, c) => (
            <div key={`col-${c}`} className="label col-label">
              {'ABCDEFGHIJ'[c]}
            </div>
          ))}
          {board.map((row, r) => (
            <div key={r} style={{ display: 'contents' }}>
              <div className="label row-label">{r + 1}</div>
              {row.map((cell, c) => {
                const key = `${r},${c}`;
                const highlighted = hoverCells.has(key);
                const isShip = cell === 'ship';
                const clickable = !allPlaced && cell === 'empty';
                return (
                  <button
                    key={key}
                    className={`cell${isShip ? ' cell-ship' : ' cell-empty'}${highlighted ? ' cell-highlight' : ''}${clickable ? ' cell-placement-clickable' : ''}`}
                    onClick={() => clickable && handleCellClick(r, c)}
                    onMouseEnter={() => !allPlaced && handleCellHover(r, c)}
                    disabled={allPlaced}
                    aria-label={`Row ${r + 1}, Column ${'ABCDEFGHIJ'[c]}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {!allPlaced && (
        <p className="placement-hint">
          Click on the grid to place your {currentConfig?.name}. Press the
          button to toggle orientation.
        </p>
      )}
      {allPlaced && (
        <p className="placement-hint">
          All ships placed! Click <strong>Start Game</strong> to begin.
        </p>
      )}
    </div>
  );
}
