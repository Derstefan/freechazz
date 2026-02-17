'use client';

import { useGameStore } from '../store/gameStore';
import { EPlayer } from '../engine/core/EPlayer';
import PieceInfoPanel from './PieceInfoPanel';

function BalanceBar({ p1: p1Val, p2: p2Val }: { p1: number; p2: number }) {
  const total = p1Val + p2Val;
  const p1Pct = total > 0 ? (p1Val / total) * 100 : 50;
  return (
    <div className="w-full h-2.5 bg-gray-700 rounded overflow-hidden flex">
      <div className="h-full bg-blue-500" style={{ width: `${p1Pct}%` }} />
      <div className="h-full bg-red-500 flex-1" />
    </div>
  );
}

export default function AnalysisPanel() {
  const game = useGameStore((s) => s.game);

  if (!game) return null;

  const p1Pieces = game.state.getAllPiecesFrom(EPlayer.P1);
  const p2Pieces = game.state.getAllPiecesFrom(EPlayer.P2);
  const p1Count = p1Pieces.length;
  const p2Count = p2Pieces.length;

  const graveyard = game.state.graveyard;
  const p1Captured = graveyard.filter(p => p.owner === EPlayer.P1);
  const p2Captured = graveyard.filter(p => p.owner === EPlayer.P2);

  return (
    <div className="flex flex-col gap-2 text-sm text-white">
      {/* Pieces */}
      <section className="bg-gray-800 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Pieces</div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-blue-400">P1: {p1Count}</span>
          <span className="text-red-400">P2: {p2Count}</span>
        </div>
        <BalanceBar p1={p1Count} p2={p2Count} />
      </section>

      {/* Captured */}
      <section className="bg-gray-800 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Captured</div>
        <div className="flex justify-between text-xs">
          <div className="text-blue-400">
            P1 lost: {p1Captured.length}
            {p1Captured.length > 0 && (
              <span className="text-gray-500 ml-1">
                ({p1Captured.map(p => p.symbol).join('')})
              </span>
            )}
          </div>
          <div className="text-red-400">
            P2 lost: {p2Captured.length}
            {p2Captured.length > 0 && (
              <span className="text-gray-500 ml-1">
                ({p2Captured.map(p => p.symbol).join('')})
              </span>
            )}
          </div>
        </div>
      </section>

      {/* PieceInfoPanel */}
      <PieceInfoPanel />
    </div>
  );
}
