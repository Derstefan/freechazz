'use client';

import { useGameStore } from '../store/gameStore';
import { EPlayer } from '../engine/core/EPlayer';

export default function GameUI() {
  const game = useGameStore((s) => s.game);
  const winner = useGameStore((s) => s.winner);
  const botThinking = useGameStore((s) => s.botThinking);
  const config = useGameStore((s) => s.config);
  const undoMove = useGameStore((s) => s.undoMove);

  if (!game) return null;

  const currentTurn = game.getPlayersTurn();
  const turnLabel = currentTurn === EPlayer.P1 ? 'Blue (P1)' : 'Red (P2)';

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-900 text-white min-w-[200px]">
      <h2 className="text-lg font-bold">FreeChazz</h2>

      <div className="text-sm">
        <span className="text-gray-400">Turn: </span>
        <span className={currentTurn === EPlayer.P1 ? 'text-blue-400' : 'text-red-400'}>
          {turnLabel}
        </span>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">Move: </span>
        <span>{game.getTurns()}</span>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">Mode: </span>
        <span>{config.mode === 'bot' ? `vs Bot (depth ${config.botDepth})` : 'Hot Seat'}</span>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">Board: </span>
        <span>{game.state.width}x{game.state.height}</span>
      </div>

      {botThinking && (
        <div className="text-yellow-400 text-sm animate-pulse">
          Bot is thinking...
        </div>
      )}

      {winner && (
        <div className="bg-yellow-600 text-black font-bold text-center py-2 px-3 rounded">
          {winner === EPlayer.P1 ? 'Blue (P1)' : 'Red (P2)'} wins!
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={undoMove}
          disabled={game.getTurns() === 0 || botThinking}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm"
        >
          Undo
        </button>

        <button
          onClick={() => {
            useGameStore.getState().cleanup();
            window.location.href = '/';
          }}
          className="bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded text-sm"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
