import { useState, useCallback } from 'react';
import type {
  Grid as GridType,
  Ship,
  ShipConfig,
  Orientation,
  LogEntry,
  GamePhase,
  Turn,
} from './game/types';
import { FLEET } from './game/types';
import {
  createEmptyGrid,
  placeShip,
  randomPlacement,
  fireAt,
  allShipsSunk,
  coordLabel,
  createAIState,
  aiSelectTarget,
  aiProcessResult,
} from './game/engine';
import type { AIState } from './game/engine';
import Grid from './components/Grid';
import ShipPlacer from './components/ShipPlacer';
import FleetStatus from './components/FleetStatus';
import GameLog from './components/GameLog';
import GameOverModal from './components/GameOverModal';

function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [turn, setTurn] = useState<Turn>('player');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);

  const [playerGrid, setPlayerGrid] = useState<GridType>(createEmptyGrid);
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);

  const [aiGrid, setAiGrid] = useState<GridType>(createEmptyGrid);
  const [aiShips, setAiShips] = useState<Ship[]>([]);

  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [currentShip, setCurrentShip] = useState<ShipConfig | null>(FLEET[0]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [aiState, setAiState] = useState<AIState>(createAIState);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  const handlePlaceShip = useCallback(
    (row: number, col: number) => {
      if (!currentShip || gamePhase !== 'setup') return;

      const result = placeShip(playerGrid, row, col, currentShip, orientation);
      if (!result) return;

      setPlayerGrid(result.grid);
      setPlayerShips((prev) => [...prev, result.ship]);

      const placedNames = [...playerShips.map((s) => s.name), currentShip.name];
      const next = FLEET.find((f) => !placedNames.includes(f.name));
      setCurrentShip(next ?? null);
    },
    [currentShip, gamePhase, playerGrid, orientation, playerShips]
  );

  const handleRandomize = useCallback(() => {
    const { grid, ships } = randomPlacement();
    setPlayerGrid(grid);
    setPlayerShips(ships);
    setCurrentShip(null);
  }, []);

  const handleStartBattle = useCallback(() => {
    const { grid, ships } = randomPlacement();
    setAiGrid(grid);
    setAiShips(ships);
    setGamePhase('battle');
    setTurn('player');
    addLog({ message: 'Battle stations! You fire first.', type: 'info' });
  }, [addLog]);

  const executeAiTurn = useCallback(
    (currentPlayerGrid: GridType, currentPlayerShips: Ship[], currentAiState: AIState) => {
      setIsAiThinking(true);
      setTimeout(() => {
        const { target, aiState: newAiState } = aiSelectTarget(
          currentPlayerGrid,
          currentAiState
        );
        const [r, c] = target;
        const result = fireAt(currentPlayerGrid, currentPlayerShips, r, c);

        setPlayerGrid(result.grid);
        setPlayerShips(result.ships);

        const label = coordLabel(r, c);
        if (result.result === 'sunk') {
          addLog({
            message: `AI fired at ${label} — sank your ${result.sunkShipName}!`,
            type: 'sunk',
          });
        } else {
          addLog({
            message: `AI fired at ${label} — ${result.result === 'hit' ? 'Hit!' : 'Miss!'}`,
            type: result.result,
          });
        }

        const updatedAiState = aiProcessResult(
          newAiState,
          target,
          result.result,
          result.grid
        );
        setAiState(updatedAiState);

        if (allShipsSunk(result.ships)) {
          setGamePhase('gameover');
          setWinner('ai');
          addLog({ message: 'The AI has sunk all your ships!', type: 'win' });
        } else {
          setTurn('player');
        }

        setIsAiThinking(false);
      }, 600);
    },
    [addLog]
  );

  const handlePlayerFire = useCallback(
    (row: number, col: number) => {
      if (gamePhase !== 'battle' || turn !== 'player' || isAiThinking) return;

      const cell = aiGrid[row][col];
      if (cell === 'hit' || cell === 'miss' || cell === 'sunk') return;

      const result = fireAt(aiGrid, aiShips, row, col);
      setAiGrid(result.grid);
      setAiShips(result.ships);

      const label = coordLabel(row, col);
      if (result.result === 'sunk') {
        addLog({
          message: `You fired at ${label} — sank the AI's ${result.sunkShipName}!`,
          type: 'sunk',
        });
      } else {
        addLog({
          message: `You fired at ${label} — ${result.result === 'hit' ? 'Hit!' : 'Miss!'}`,
          type: result.result,
        });
      }

      if (allShipsSunk(result.ships)) {
        setGamePhase('gameover');
        setWinner('player');
        addLog({ message: 'You sank the entire enemy fleet!', type: 'win' });
        return;
      }

      setTurn('ai');
      executeAiTurn(playerGrid, playerShips, aiState);
    },
    [
      gamePhase,
      turn,
      isAiThinking,
      aiGrid,
      aiShips,
      addLog,
      playerGrid,
      playerShips,
      aiState,
      executeAiTurn,
    ]
  );

  const handleRestart = useCallback(() => {
    setGamePhase('setup');
    setTurn('player');
    setWinner(null);
    setPlayerGrid(createEmptyGrid());
    setPlayerShips([]);
    setAiGrid(createEmptyGrid());
    setAiShips([]);
    setOrientation('horizontal');
    setCurrentShip(FLEET[0]);
    setLogs([]);
    setAiState(createAIState());
    setIsAiThinking(false);
  }, []);

  const placedShipNames = playerShips.map((s) => s.name);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-sky-400">⚓</span> Battleship
          </h1>
          <div className="flex items-center gap-4">
            {gamePhase === 'battle' && (
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  isAiThinking
                    ? 'bg-amber-900/50 text-amber-400'
                    : 'bg-green-900/50 text-green-400'
                }`}
              >
                {isAiThinking ? 'AI is thinking...' : 'Your turn — fire!'}
              </span>
            )}
            {gamePhase === 'setup' && (
              <span className="text-sm text-slate-400">Setup Phase</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Player Grid */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-3 text-slate-300">
              Your Fleet
            </h2>
            <Grid
              grid={playerGrid}
              isPlayerGrid={true}
              onCellClick={
                gamePhase === 'setup' ? handlePlaceShip : undefined
              }
              isInteractive={gamePhase === 'setup' && currentShip !== null}
              placingShip={gamePhase === 'setup' ? currentShip : null}
              orientation={orientation}
            />
            {gamePhase !== 'setup' && playerShips.length > 0 && (
              <div className="mt-3">
                <FleetStatus ships={playerShips} label="Your Ships" />
              </div>
            )}
          </div>

          {/* Center: Controls / Log */}
          <div className="w-full lg:w-64 space-y-4">
            {gamePhase === 'setup' && (
              <ShipPlacer
                placedShips={placedShipNames}
                currentShip={currentShip}
                orientation={orientation}
                onToggleOrientation={() =>
                  setOrientation((o) =>
                    o === 'horizontal' ? 'vertical' : 'horizontal'
                  )
                }
                onRandomize={handleRandomize}
                onStartBattle={handleStartBattle}
                onSelectShip={setCurrentShip}
              />
            )}
            {gamePhase !== 'setup' && <GameLog logs={logs} />}
            {gamePhase !== 'setup' && aiShips.length > 0 && (
              <FleetStatus ships={aiShips} label="Enemy Ships" />
            )}
          </div>

          {/* Right: AI Grid */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-3 text-slate-300">
              Enemy Waters
            </h2>
            <Grid
              grid={aiGrid}
              isPlayerGrid={false}
              onCellClick={
                gamePhase === 'battle' ? handlePlayerFire : undefined
              }
              isInteractive={
                gamePhase === 'battle' && turn === 'player' && !isAiThinking
              }
            />
          </div>
        </div>
      </main>

      {gamePhase === 'gameover' && winner && (
        <GameOverModal winner={winner} onRestart={handleRestart} />
      )}
    </div>
  );
}

export default App;
