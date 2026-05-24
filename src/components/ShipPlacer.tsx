import type { ShipConfig, Orientation } from '../game/types';
import { FLEET } from '../game/types';

interface ShipPlacerProps {
  placedShips: string[];
  currentShip: ShipConfig | null;
  orientation: Orientation;
  onToggleOrientation: () => void;
  onRandomize: () => void;
  onStartBattle: () => void;
  onSelectShip: (ship: ShipConfig) => void;
}

export default function ShipPlacer({
  placedShips,
  currentShip,
  orientation,
  onToggleOrientation,
  onRandomize,
  onStartBattle,
  onSelectShip,
}: ShipPlacerProps) {
  const allPlaced = placedShips.length === FLEET.length;

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-3">
      <h3 className="text-white font-bold text-lg">Place Your Ships</h3>

      <div className="space-y-1">
        {FLEET.map((ship) => {
          const isPlaced = placedShips.includes(ship.name);
          const isActive = currentShip?.name === ship.name;
          return (
            <button
              key={ship.name}
              type="button"
              onClick={() => !isPlaced && onSelectShip(ship)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                isPlaced
                  ? 'bg-green-900/40 text-green-400 cursor-default'
                  : isActive
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              disabled={isPlaced}
            >
              {ship.name} ({ship.length})
              {isPlaced && ' — placed'}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleOrientation}
          className="flex-1 bg-slate-600 hover:bg-slate-500 text-white text-sm py-2 px-3 rounded transition-colors"
        >
          {orientation === 'horizontal' ? '↔ Horizontal' : '↕ Vertical'}
        </button>
        <button
          type="button"
          onClick={onRandomize}
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm py-2 px-3 rounded transition-colors"
        >
          Randomize
        </button>
      </div>

      {allPlaced && (
        <button
          type="button"
          onClick={onStartBattle}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded transition-colors text-lg"
        >
          Start Battle!
        </button>
      )}
    </div>
  );
}
