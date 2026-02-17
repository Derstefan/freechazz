import { BetterBotClean } from './BetterBotClean';
import { EPlayer } from '../engine/core/EPlayer';
import { ESize } from '../engine/core/ESize';
import { Pos } from '../engine/core/Pos';
import { FormationGenerator } from '../engine/generators/FormationGenerator';
import { GameBuilder } from '../engine/game/GameBuilder';
import type { BotRequest, BotWorkerResponse, FormationData } from './BotWorkerMessages';
import type { BoardSize } from '../engine/core/ESize';

function getSizeFromName(name: string): BoardSize {
  switch (name) {
    case 'tiny': return ESize.tiny;
    case 'small': return ESize.small;
    case 'medium': return ESize.medium;
    case 'big': return ESize.big;
    case 'huge': return ESize.huge;
    case 'massive': return ESize.massive;
    case 'gigantic': return ESize.gigantic;
    default: return ESize.tiny;
  }
}

self.onmessage = (e: MessageEvent<BotRequest>) => {
  const { gameSnapshot, botPlayer, maxDepth } = e.data;

  // Reconstruct game from snapshot
  const size = getSizeFromName(gameSnapshot.formation1Data.sizeName);

  const gen1 = new FormationGenerator(gameSnapshot.formation1Data.formationSeed, size);
  const formation1 = gen1.generate();

  let formation2;
  if (gameSnapshot.formation2Data.samePieces) {
    const gen2 = new FormationGenerator(gameSnapshot.formation1Data.formationSeed, size);
    formation2 = gen2.generate();
  } else {
    const gen2 = new FormationGenerator(gameSnapshot.formation2Data.formationSeed, size);
    formation2 = gen2.generate();
  }

  const game = new GameBuilder(formation1, formation2)
    .firstPlayer(gameSnapshot.firstTurn)
    .build();

  // Replay moves
  for (const move of gameSnapshot.moves) {
    game.play(new Pos(move.fromX, move.fromY), new Pos(move.toX, move.toY));
  }

  // Run bot
  const bot = new BetterBotClean(botPlayer, maxDepth);
  const result = bot.doDrawOn(game);

  if (!result) {
    const response: BotWorkerResponse = { type: 'surrender' };
    self.postMessage(response);
  } else {
    const response: BotWorkerResponse = {
      type: 'result',
      fromX: result.fromPos.x,
      fromY: result.fromPos.y,
      toX: result.toPos.x,
      toY: result.toPos.y,
    };
    self.postMessage(response);
  }
};
