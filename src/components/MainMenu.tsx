'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore, type GameMode } from '../store/gameStore';
import type { ESizeName } from '../engine/core/ESize';

const SIZES: { label: string; value: ESizeName }[] = [
  { label: 'Tiny (10x10)', value: 'tiny' },
  { label: 'Small (15x15)', value: 'small' },
  { label: 'Medium (20x20)', value: 'medium' },
  { label: 'Big (30x30)', value: 'big' },
];

const EXPERIMENTAL_SIZES: { label: string; value: ESizeName }[] = [
  { label: 'Huge (50x33)', value: 'huge' },
  { label: 'Massive (100x50)', value: 'massive' },
  { label: 'Gigantic (500x200)', value: 'gigantic' },
];

const MODES: { label: string; value: GameMode }[] = [
  { label: 'vs Bot', value: 'bot' },
  { label: 'Hot Seat', value: 'hotseat' },
];

const DEPTHS = [1, 2, 3, 4];

export default function MainMenu() {
  const router = useRouter();
  const setConfig = useGameStore((s) => s.setConfig);
  const startGame = useGameStore((s) => s.startGame);
  const config = useGameStore((s) => s.config);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExperimental, setShowExperimental] = useState(false);
  const [useSeed, setUseSeed] = useState(false);
  const [seedText, setSeedText] = useState('');

  const handleStart = () => {
    if (useSeed && seedText) {
      const parsed = parseInt(seedText);
      if (!isNaN(parsed)) {
        setConfig({ seed: parsed });
      }
    } else {
      setConfig({ seed: null });
    }

    startGame();
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          FreeChazz
        </h1>

        {/* Game Mode */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Game Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setConfig({ mode: m.value })}
                className={`py-2 px-4 rounded font-medium text-sm transition-colors ${
                  config.mode === m.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Board Size */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Board Size</label>
          <div className="grid grid-cols-2 gap-2">
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setConfig({ sizeName: s.value })}
                className={`py-2 px-4 rounded font-medium text-sm transition-colors ${
                  config.sizeName === s.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {!showExperimental ? (
            <button
              onClick={() => setShowExperimental(true)}
              className="text-gray-500 text-sm hover:text-gray-300 mt-2 block"
            >
              ... experimental
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {EXPERIMENTAL_SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setConfig({ sizeName: s.value })}
                  className={`py-2 px-4 rounded font-medium text-sm transition-colors ${
                    config.sizeName === s.value
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bot Depth (only in bot mode) */}
        {config.mode === 'bot' && (
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">
              Bot Difficulty (Search Depth)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DEPTHS.map((d) => (
                <button
                  key={d}
                  onClick={() => setConfig({ botDepth: d })}
                  className={`py-2 px-3 rounded font-medium text-sm transition-colors ${
                    config.botDepth === d
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Options */}
        {!showAdvanced && (
          <button
            onClick={() => setShowAdvanced(true)}
            className="text-gray-500 text-sm hover:text-gray-300 mb-4 block"
          >
            More Options...
          </button>
        )}

        {showAdvanced && (
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={config.samePieces}
                onChange={(e) => setConfig({ samePieces: e.target.checked })}
                className="rounded"
              />
              Same Pieces for both players
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={config.botActions}
                onChange={(e) => setConfig({ botActions: e.target.checked })}
                className="rounded"
              />
              Fight with Bot Actions
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={useSeed}
                onChange={(e) => setUseSeed(e.target.checked)}
                className="rounded"
              />
              Custom Seed
            </label>

            {useSeed && (
              <input
                type="number"
                value={seedText}
                onChange={(e) => setSeedText(e.target.value)}
                placeholder="Enter seed number"
                className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm border border-gray-600"
              />
            )}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
