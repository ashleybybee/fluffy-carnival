import type { LogEntry } from '../game/types';
import { useEffect, useRef } from 'react';

interface GameLogProps {
  logs: LogEntry[];
}

export default function GameLog({ logs }: GameLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const colorMap: Record<LogEntry['type'], string> = {
    hit: 'text-red-400',
    miss: 'text-slate-400',
    sunk: 'text-orange-400 font-bold',
    info: 'text-sky-400',
    win: 'text-yellow-400 font-bold',
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 flex flex-col h-64">
      <h3 className="text-white font-bold text-sm mb-2">Battle Log</h3>
      <div className="flex-1 overflow-y-auto space-y-1 text-xs">
        {logs.map((entry, i) => (
          <div key={i} className={colorMap[entry.type]}>
            {entry.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
