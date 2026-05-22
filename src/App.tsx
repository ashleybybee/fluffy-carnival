import { useState, useCallback, useRef } from 'react';
import type { Phase, Winner, Ship } from './types';
import type { Board as BoardType } from './gameLogic';
import {
  placeShipsRandomly,
  fireAt,
  allShipsSunk,
  aiMove,
  createAiState,
  updateAiState,
} from './gameLogic';
import Board from './components/Board';
import ShipPlacement from './components/ShipPlacement';
import WinModal from './components/WinModal';
import './App.css';

interface GameState {
  playerBoard: BoardType;
  playerShips: Ship[];
  aiBoard: BoardType;
  aiShips: Ship[];
  playerTurn: boolean;
  message: string;
}

function App() {
  const [phase, setPhase] = useState<Phase>('placement');
  const [winner, setWinner] = useState<Winner>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const aiStateRef = useRef(createAiState());

  const handlePlacementComplete = useCallback(
    (playerBoard: BoardType, playerShips: Ship[]) => {
      const { board: aiBoard, ships: aiShips } = placeShipsRandomly();
      setGame({
        playerBoard,
        playerShips,
        aiBoard,
        aiShips,
        playerTurn: true,
        message: 'Your turn — fire at the enemy grid!',
      });
      aiStateRef.current = createAiState();
      setPhase('playing');
    },
    []
  );

  const handlePlayerFire = useCallback(
    (row: number, col: number) => {
      if (!game || !game.playerTurn || phase !== 'playing') return;

      const { board: newAiBoard, result } = fireAt(
        game.aiBoard,
        game.aiShips,
        row,
        col
      );
      if (result === 'already') return;

      const hitMsg = result === 'hit' ? 'Hit!' : 'Miss!';

      if (allShipsSunk(game.aiShips)) {
        setGame((prev) =>
          prev
            ? {
                ...prev,
                aiBoard: newAiBoard,
                playerTurn: false,
                message: 'You sank all enemy ships!',
              }
            : prev
        );
        setWinner('player');
        setPhase('gameOver');
        return;
      }

      // AI turn
      const move = aiMove(game.playerBoard, aiStateRef.current);
      const { board: newPlayerBoard, result: aiResult } = fireAt(
        game.playerBoard,
        game.playerShips,
        move.row,
        move.col
      );
      updateAiState(
        aiStateRef.current,
        newPlayerBoard,
        move.row,
        move.col,
        aiResult as 'hit' | 'miss'
      );

      const aiMsg = aiResult === 'hit' ? 'AI hit your ship!' : 'AI missed.';

      if (allShipsSunk(game.playerShips)) {
        setGame((prev) =>
          prev
            ? {
                ...prev,
                aiBoard: newAiBoard,
                playerBoard: newPlayerBoard,
                playerTurn: false,
                message: 'The AI sank all your ships!',
              }
            : prev
        );
        setWinner('ai');
        setPhase('gameOver');
        return;
      }

      setGame((prev) =>
        prev
          ? {
              ...prev,
              aiBoard: newAiBoard,
              playerBoard: newPlayerBoard,
              playerTurn: true,
              message: `${hitMsg} ${aiMsg} Your turn.`,
            }
          : prev
      );
    },
    [game, phase]
  );

  const handlePlayAgain = useCallback(() => {
    setPhase('placement');
    setGame(null);
    setWinner(null);
    aiStateRef.current = createAiState();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Battleship</h1>
      </header>

      {phase === 'placement' && (
        <ShipPlacement onComplete={handlePlacementComplete} />
      )}

      {phase !== 'placement' && game && (
        <>
          <div className="game-status">
            <p className="status-message">{game.message}</p>
          </div>
          <div className="boards">
            <div className="board-section">
              <h3>Your Fleet</h3>
              <Board board={game.playerBoard} isOpponent={false} />
            </div>
            <div className="board-section">
              <h3>Enemy Waters</h3>
              <Board
                board={game.aiBoard}
                isOpponent={true}
                onCellClick={handlePlayerFire}
                disabled={!game.playerTurn || phase === 'gameOver'}
              />
            </div>
          </div>
        </>
      )}

      <WinModal winner={winner} onPlayAgain={handlePlayAgain} />
    </div>
  );
}

export default App;
