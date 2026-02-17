'use client';

import { useGameStore } from '../store/gameStore';
import { EPlayer } from '../engine/core/EPlayer';
import { getActionColor } from '../engine/actions/ActionColors';

export default function PieceInfoPanel() {
  const selectedPiece = useGameStore((s) => s.selectedPiece);

  if (!selectedPiece) return null;

  const pt = selectedPiece.pieceType;
  const ownerLabel = selectedPiece.owner === EPlayer.P1 ? 'Blue (P1)' : 'Red (P2)';
  const ownerColor = selectedPiece.owner === EPlayer.P1 ? 'text-blue-400' : 'text-red-400';

  const isP1 = selectedPiece.owner === EPlayer.P1;

  // Build action map grid
  const actionMap = pt.actionMap;
  const keys = actionMap.keySet();

  // Find bounds of action map
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (const pos of keys) {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  }

  // Add center
  minX = Math.min(minX, -1);
  maxX = Math.max(maxX, 1);
  minY = Math.min(minY, -1);
  maxY = Math.max(maxY, 1);

  const gridWidth = maxX - minX + 1;
  const gridHeight = maxY - minY + 1;

  // Collect unique action symbols used by this piece
  const usedSymbols = new Set<string>();
  for (const pos of keys) {
    const action = actionMap.getByXY(pos.x, pos.y);
    if (action?.symbol) usedSymbols.add(action.symbol);
  }

  return (
    <div className="bg-gray-800 text-white p-3 rounded text-sm">
      <div className="font-bold mb-1">
        {selectedPiece.king ? 'King ' : ''}
        <span className="text-lg">{pt.symbol}</span>
      </div>
      <div className="text-gray-400">
        Owner: <span className={ownerColor}>{ownerLabel}</span>
      </div>
      <div className="text-gray-400 mb-2">
        Level: {pt.pieceTypeId.lvl}
      </div>

      {/* Action Map Grid */}
      <div className="text-xs text-gray-500 mb-1">Action Map:</div>
      <div
        className="inline-grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, 18px)`,
          gridTemplateRows: `repeat(${gridHeight}, 18px)`,
        }}
      >
        {Array.from({ length: gridHeight }, (_, row) =>
          Array.from({ length: gridWidth }, (_, col) => {
            const x = col + minX;
            const y = isP1 ? (maxY - row) : (row + minY);
            const isCenter = x === 0 && y === 0;
            const action = actionMap.getByXY(x, y);

            let bg: string | undefined;
            let text = '';
            let title = '';
            if (isCenter) {
              bg = '#ca8a04'; // yellow-600 equivalent
              text = pt.symbol;
              title = 'Piece position';
            } else if (action) {
              const colorEntry = getActionColor(action.symbol);
              bg = colorEntry.hex;
              text = action.symbol;
              title = `${action.symbol}: ${colorEntry.description}`;
            }

            return (
              <div
                key={`${x},${y}`}
                className="border border-gray-600 flex items-center justify-center text-[10px] font-mono"
                style={{ backgroundColor: bg ?? '#374151' }}
                title={title}
              >
                {text}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      {usedSymbols.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {Array.from(usedSymbols).map((sym) => {
            const entry = getActionColor(sym);
            return (
              <div key={sym} className="flex items-center gap-1 text-[10px] text-gray-300" title={entry.description}>
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: entry.hex }}
                />
                <span className="font-mono font-bold">{sym}</span>
                <span>{entry.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
