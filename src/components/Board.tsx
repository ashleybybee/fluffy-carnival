import type { Board as BoardType } from '../gameLogic';
import type { CellState } from '../types';
import { BOARD_SIZE } from '../types';

interface BoardProps {
  board: BoardType;
  isOpponent: boolean;
  onCellClick?: (row: number, col: number) => void;
  highlightCells?: Set<string>;
  disabled?: boolean;
}

function cellClass(cell: CellState, isOpponent: boolean): string {
  if (cell === 'hit') return 'cell cell-hit';
  if (cell === 'miss') return 'cell cell-miss';
  if (cell === 'ship' && !isOpponent) return 'cell cell-ship';
  return 'cell cell-empty';
}

const COL_LABELS = 'ABCDEFGHIJ';

export default function Board({
  board,
  isOpponent,
  onCellClick,
  highlightCells,
  disabled,
}: BoardProps) {
  return (
    <div className="board-wrapper">
      <div className="board-grid">
        {/* Corner spacer */}
        <div className="label corner" />
        {/* Column headers */}
        {Array.from({ length: BOARD_SIZE }, (_, c) => (
          <div key={`col-${c}`} className="label col-label">
            {COL_LABELS[c]}
          </div>
        ))}
        {/* Rows */}
        {board.map((row, r) => (
          <div key={r} className="board-row" style={{ display: 'contents' }}>
            <div className="label row-label">{r + 1}</div>
            {row.map((cell, c) => {
              const key = `${r},${c}`;
              const highlighted = highlightCells?.has(key);
              const clickable =
                !disabled && isOpponent && (cell === 'empty' || cell === 'ship');
              return (
                <button
                  key={key}
                  className={`${cellClass(cell, isOpponent)}${highlighted ? ' cell-highlight' : ''}${clickable ? ' cell-clickable' : ''}`}
                  onClick={() => clickable && onCellClick?.(r, c)}
                  disabled={!clickable}
                  aria-label={`Row ${r + 1}, Column ${COL_LABELS[c]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
