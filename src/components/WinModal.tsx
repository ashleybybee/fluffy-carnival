import type { Winner } from '../types';

interface WinModalProps {
  winner: Winner;
  onPlayAgain: () => void;
}

export default function WinModal({ winner, onPlayAgain }: WinModalProps) {
  if (!winner) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{winner === 'player' ? 'You Win!' : 'AI Wins!'}</h2>
        <p>
          {winner === 'player'
            ? 'Congratulations! You sank all enemy ships!'
            : 'The AI has sunk all your ships. Better luck next time!'}
        </p>
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
