interface GameOverModalProps {
  winner: 'player' | 'ai';
  onRestart: () => void;
}

export default function GameOverModal({ winner, onRestart }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-8 text-center max-w-sm mx-4 shadow-2xl border border-slate-600">
        <div className="text-5xl mb-4">
          {winner === 'player' ? '🏆' : '💀'}
        </div>
        <h2 className="text-3xl font-bold mb-2 text-white">
          {winner === 'player' ? 'Victory!' : 'Defeat!'}
        </h2>
        <p className="text-slate-400 mb-6">
          {winner === 'player'
            ? 'You sank the entire enemy fleet!'
            : 'The AI has destroyed your fleet.'}
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
