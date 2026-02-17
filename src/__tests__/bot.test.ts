import { describe, it, expect, beforeEach } from 'vitest';
import { BetterBotClean } from '../bot/BetterBotClean';
import { Game } from '../engine/game/Game';
import { GameBuilder } from '../engine/game/GameBuilder';
import { FormationGenerator } from '../engine/generators/FormationGenerator';
import { EPlayer } from '../engine/core/EPlayer';
import { ESize } from '../engine/core/ESize';
import { resetPieceIdCounter } from '../engine/pieces/Piece';

function createGame(seed: number = 42): Game {
  resetPieceIdCounter();
  const size = ESize.tiny;
  const f1 = new FormationGenerator(seed, size).generate();
  const f2 = new FormationGenerator(seed, size).generate();
  return new GameBuilder(f1, f2).firstTurnP1().build();
}

describe('BetterBotClean', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  it('returns a valid move', () => {
    const game = createGame();
    // Make first move as P1
    const p1pieces = game.state.getAllPiecesFrom(EPlayer.P1);
    for (const piece of p1pieces) {
      const moves = piece.moveSet.getPossibleMoves();
      if (moves.length > 0) {
        game.play(piece.pos, moves[0]);
        break;
      }
    }

    // Now it's P2's turn - bot should find a move
    const bot = new BetterBotClean(EPlayer.P2, 1, 42);
    const result = bot.doDrawOn(game);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.fromPos).toBeDefined();
      expect(result.toPos).toBeDefined();
    }
  });

  it('returns a valid move at depth 2', () => {
    const game = createGame(99);
    const p1pieces = game.state.getAllPiecesFrom(EPlayer.P1);
    for (const piece of p1pieces) {
      const moves = piece.moveSet.getPossibleMoves();
      if (moves.length > 0) {
        game.play(piece.pos, moves[0]);
        break;
      }
    }

    const bot = new BetterBotClean(EPlayer.P2, 2, 42);
    const result = bot.doDrawOn(game);
    expect(result).not.toBeNull();
  });

  it('bot vs bot can play a full game', () => {
    const game = createGame(55);
    const bot1 = new BetterBotClean(EPlayer.P1, 1, 10);
    const bot2 = new BetterBotClean(EPlayer.P2, 1, 20);

    let turns = 0;
    const maxTurns = 100;

    while (!game.getWinner() && turns < maxTurns) {
      const currentBot = game.getPlayersTurn() === EPlayer.P1 ? bot1 : bot2;
      const result = currentBot.doDrawOn(game);

      if (!result) {
        game.surrender();
        break;
      }

      const success = game.play(result.fromPos, result.toPos);
      if (!success) break;
      turns++;
    }

    // Game should have progressed
    expect(turns).toBeGreaterThan(0);
  });
});
