import type { Ship } from '../game/types';

interface FleetStatusProps {
  ships: Ship[];
  label: string;
}

export default function FleetStatus({ ships, label }: FleetStatusProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-white font-bold text-sm mb-2">{label}</h3>
      <div className="space-y-1">
        {ships.map((ship) => (
          <div
            key={ship.name}
            className={`flex items-center gap-2 text-sm ${
              ship.sunk ? 'text-red-400 line-through' : 'text-slate-300'
            }`}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: ship.length }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    ship.sunk
                      ? 'bg-red-800'
                      : i < ship.hits.size
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }`}
                />
              ))}
            </div>
            <span>{ship.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
