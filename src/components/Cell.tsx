import type { CellState } from '../game/types';

interface CellProps {
  state: CellState;
  isPlayerGrid: boolean;
  onClick?: () => void;
  isHoverable?: boolean;
  previewState?: 'valid' | 'invalid' | null;
}

export default function Cell({
  state,
  isPlayerGrid,
  onClick,
  isHoverable,
  previewState,
}: CellProps) {
  let bgClass = 'bg-slate-700';
  let content = '';
  let extraClass = '';

  switch (state) {
    case 'empty':
      bgClass = 'bg-slate-700';
      break;
    case 'ship':
      bgClass = isPlayerGrid ? 'bg-blue-500' : 'bg-slate-700';
      break;
    case 'miss':
      bgClass = 'bg-slate-600';
      content = '•';
      extraClass = 'text-white text-xl';
      break;
    case 'hit':
      bgClass = 'bg-red-600';
      content = '✕';
      extraClass = 'text-white font-bold text-lg';
      break;
    case 'sunk':
      bgClass = 'bg-red-900';
      content = '✕';
      extraClass = 'text-red-300 font-bold text-lg';
      break;
  }

  if (previewState === 'valid') {
    bgClass = 'bg-green-500/60';
  } else if (previewState === 'invalid') {
    bgClass = 'bg-red-500/60';
  }

  const clickable =
    isHoverable &&
    state !== 'hit' &&
    state !== 'miss' &&
    state !== 'sunk';

  return (
    <button
      type="button"
      className={`w-9 h-9 ${bgClass} ${extraClass} border border-slate-600 rounded-sm flex items-center justify-center transition-colors ${
        clickable
          ? 'hover:bg-sky-400 cursor-crosshair'
          : 'cursor-default'
      }`}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
    >
      {content}
    </button>
  );
}
