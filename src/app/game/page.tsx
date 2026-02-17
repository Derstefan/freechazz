'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/gameStore';
import GameCanvas from '../../components/GameCanvas';
import GameUI from '../../components/GameUI';
import AnalysisPanel from '../../components/AnalysisPanel';

export default function GamePage() {
  const router = useRouter();
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    if (!game) {
      router.push('/');
    }
  }, [game, router]);

  if (!game) return null;

  return (
    <div className="h-screen flex">
      {/* Left sidebar */}
      <GameUI />

      {/* Main canvas area */}
      <div className="flex-1 relative">
        <GameCanvas />
      </div>

      {/* Right sidebar - analysis */}
      <div className="w-[320px] p-2 bg-gray-900 overflow-y-auto">
        <AnalysisPanel />
      </div>
    </div>
  );
}
