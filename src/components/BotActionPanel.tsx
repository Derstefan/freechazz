'use client';

import { useGameStore } from '../store/gameStore';
import { BotActionType, type BotActionInfo } from '../engine/botactions/BotActionType';

const ACTION_ICONS: Record<BotActionType, string> = {
  [BotActionType.RUSH_50]: '\u{2694}',          // crossed swords
  [BotActionType.ADVANCE_SAFE_20]: '\u{1F9ED}', // compass
  [BotActionType.ATTACK]: '\u{1F3AF}',          // bullseye
  [BotActionType.FORMATION]: '\u{1F3F0}',       // castle
  [BotActionType.COVER]: '\u{1F6E1}',           // shield
  [BotActionType.EVADE]: '\u{1F3C3}',           // runner
  [BotActionType.DEFEND_KING]: '\u{1F451}',     // crown
};

const ACTION_TOOLTIPS: Record<BotActionType, string> = {
  [BotActionType.RUSH_50]: '50% of pieces rush toward the enemy king, ignoring threats.',
  [BotActionType.ADVANCE_SAFE_20]: '30% of pieces advance toward the enemy king, avoiding threatened squares.',
  [BotActionType.ATTACK]: 'Attack enemy pieces that cannot be recaptured safely.',
  [BotActionType.FORMATION]: 'Move pieces to cover currently unprotected friendly pieces.',
  [BotActionType.COVER]: 'Position backup pieces to protect threatened frontline pieces.',
  [BotActionType.EVADE]: 'Move threatened pieces to safe squares.',
  [BotActionType.DEFEND_KING]: 'Move pieces closer to the king and cover threatened squares around him.',
};

export default function BotActionPanel() {
  const computedActions = useGameStore((s) => s.computedActions);
  const botThinking = useGameStore((s) => s.botThinking);
  const game = useGameStore((s) => s.game);
  const winner = useGameStore((s) => s.winner);
  const executeBotAction = useGameStore((s) => s.executeBotAction);
  const setHoveredAction = useGameStore((s) => s.setHoveredAction);

  if (!computedActions || !game) return null;

  const disabled = botThinking || !!winner;

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-900/90 rounded-lg min-w-[180px]">
      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
        Bot Actions
      </div>
      {computedActions.map((action) => (
        <button
          key={action.type}
          onClick={() => executeBotAction(action)}
          onMouseEnter={() => action.moves.length > 0 && setHoveredAction(action)}
          onMouseLeave={() => setHoveredAction(null)}
          disabled={disabled || action.moves.length === 0}
          title={ACTION_TOOLTIPS[action.type]}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors text-left
            ${action.moves.length === 0
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : disabled
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-gray-200 hover:bg-blue-700 hover:text-white'
            }`}
        >
          <span className="text-base">{ACTION_ICONS[action.type]}</span>
          <span className="flex-1">{action.label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            action.moves.length > 0 ? 'bg-gray-600 text-gray-300' : 'bg-gray-800 text-gray-600'
          }`}>
            {action.pieceCount}
          </span>
        </button>
      ))}
      {botThinking && (
        <div className="text-yellow-400 text-xs animate-pulse mt-1">
          Bot is choosing...
        </div>
      )}
    </div>
  );
}
