import type { Grid as GridType, Orientation, ShipConfig } from '../game/types';
import { ROW_LABELS, GRID_SIZE } from '../game/types';
import { canPlaceShip } from '../game/engine';
import Cell from './Cell';
import { useState } from 'react';

interface GridProps {
  grid: GridType;
  isPlayerGrid: boolean;
  onCellClick?: (row: number, col: number) => void;
  isInteractive?: boolean;
  placingShip?: ShipConfig | null;
  orientation?: Orientation;
}

export default function Grid({
  grid,
  isPlayerGrid,
  onCellClick,
  isInteractive,
  placingShip,
  orientation,
}: GridProps) {
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  function getPreviewState(
    row: number,
    col: number
  ): 'valid' | 'invalid' | null {
    if (!placingShip || !hoverCell || !orientation) return null;
    const [hr, hc] = hoverCell;
    const cells: [number, number][] = [];
    for (let i = 0; i < placingShip.length; i++) {
      const r = orientation === 'vertical' ? hr + i : hr;
      const c = orientation === 'horizontal' ? hc + i : hc;
      cells.push([r, c]);
    }
    const isPartOfPreview = cells.some(([r, c]) => r === row && c === col);
    if (!isPartOfPreview) return null;
    const valid = canPlaceShip(grid, hr, hc, placingShip.length, orientation);
    return valid ? 'valid' : 'invalid';
  }

  return (
    <div className="inline-block">
      <div className="flex">
        <div className="w-9 h-9" />
        {Array.from({ length: GRID_SIZE }, (_, i) => (
          <div
            key={i}
            className="w-9 h-9 flex items-center justify-center text-xs font-bold text-slate-400"
          >
            {i + 1}
          </div>
        ))}
      </div>
      {grid.map((row, r) => (
        <div key={r} className="flex">
          <div className="w-9 h-9 flex items-center justify-center text-xs font-bold text-slate-400">
            {ROW_LABELS[r]}
          </div>
          {row.map((cell, c) => (
            <div
              key={c}
              onMouseEnter={() => placingShip && setHoverCell([r, c])}
              onMouseLeave={() => placingShip && setHoverCell(null)}
            >
              <Cell
                state={cell}
                isPlayerGrid={isPlayerGrid}
                onClick={() => onCellClick?.(r, c)}
                isHoverable={isInteractive}
                previewState={getPreviewState(r, c)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
