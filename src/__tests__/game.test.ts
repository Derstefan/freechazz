import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../engine/game/Game';
import { GameBuilder } from '../engine/game/GameBuilder';
import { FormationGenerator } from '../engine/generators/FormationGenerator';
import { EPlayer, getOpponent } from '../engine/core/EPlayer';
import { ESize } from '../engine/core/ESize';
import { Pos } from '../engine/core/Pos';
import { resetPieceIdCounter } from '../engine/pieces/Piece';

function createGame(seed: number = 42): Game {
  resetPieceIdCounter();
  const size = ESize.tiny;
  const f1 = new FormationGenerator(seed, size).generate();
  const f2 = new FormationGenerator(seed, size).generate();
  return new GameBuilder(f1, f2).firstTurnP1().build();
}

describe('Game', () => {
  beforeEach(() => {
    resetPieceIdCounter();
  });

  it('creates a game with pieces on the board', () => {
    const game = createGame();
    const pieces = game.state.getAllPieces();
    expect(pieces.length).toBeGreaterThan(0);
  });

  it('starts with P1 turn', () => {
    const game = createGame();
    expect(game.getPlayersTurn()).toBe(EPlayer.P1);
  });

  it('has no winner initially', () => {
    const game = createGame();
    expect(game.getWinner()).toBeNull();
  });

  it('has pieces for both players', () => {
    const game = createGame();
    const p1 = game.state.getAllPiecesFrom(EPlayer.P1);
    const p2 = game.state.getAllPiecesFrom(EPlayer.P2);
    expect(p1.length).toBeGreaterThan(0);
    expect(p2.length).toBeGreaterThan(0);
  });

  it('has kings for both players', () => {
    const game = createGame();
    expect(game.state.king1).not.toBeNull();
    expect(game.state.king2).not.toBeNull();
    expect(game.state.king1!.king).toBe(true);
    expect(game.state.king2!.king).toBe(true);
  });

  it('can play a valid move and switch turns', () => {
    const game = createGame();
    const p1pieces = game.state.getAllPiecesFrom(EPlayer.P1);

    // Find a piece with moves
    let moved = false;
    for (const piece of p1pieces) {
      const moves = piece.moveSet.getPossibleMoves();
      if (moves.length > 0) {
        const success = game.play(piece.pos, moves[0]);
        if (success) {
          moved = true;
          break;
        }
      }
    }

    expect(moved).toBe(true);
    expect(game.getPlayersTurn()).toBe(EPlayer.P2);
    expect(game.getTurns()).toBe(1);
  });

  it('rejects invalid moves', () => {
    const game = createGame();
    // Try to move to an invalid position
    const p1pieces = game.state.getAllPiecesFrom(EPlayer.P1);
    if (p1pieces.length > 0) {
      const result = game.play(p1pieces[0].pos, new Pos(-1, -1));
      expect(result).toBe(false);
    }
  });

  it('rejects moves from wrong player', () => {
    const game = createGame();
    // P1's turn - try to move P2's piece
    const p2pieces = game.state.getAllPiecesFrom(EPlayer.P2);
    if (p2pieces.length > 0 && p2pieces[0].moveSet.getPossibleMoves().length > 0) {
      const result = game.play(p2pieces[0].pos, p2pieces[0].moveSet.getPossibleMoves()[0]);
      expect(result).toBe(false);
    }
  });

  it('undo restores previous state', () => {
    const game = createGame();
    const p1pieces = game.state.getAllPiecesFrom(EPlayer.P1);

    const beforeCount = game.state.getAllPieces().length;

    let moved = false;
    for (const piece of p1pieces) {
      const moves = piece.moveSet.getPossibleMoves();
      if (moves.length > 0) {
        game.play(piece.pos, moves[0]);
        moved = true;
        break;
      }
    }

    if (moved) {
      expect(game.getTurns()).toBe(1);
      game.undo();
      expect(game.getTurns()).toBe(0);
      expect(game.getPlayersTurn()).toBe(EPlayer.P1);
    }
  });

  it('copy creates independent game', () => {
    const game = createGame();
    const copy = game.copy();

    expect(copy.getPlayersTurn()).toBe(game.getPlayersTurn());
    expect(copy.getTurns()).toBe(game.getTurns());

    const originalPieceCount = game.state.getAllPieces().length;

    // Mutate copy - should not affect original
    const copyPieces = copy.state.getAllPiecesFrom(copy.getPlayersTurn());
    for (const piece of copyPieces) {
      const moves = piece.moveSet.getPossibleMoves();
      if (moves.length > 0) {
        copy.play(piece.pos, moves[0]);
        break;
      }
    }

    expect(game.getTurns()).toBe(0);
    expect(copy.getTurns()).toBe(1);
    // Original game should not be affected by copy's move
    expect(game.state.getAllPieces().length).toBe(originalPieceCount);
  });

  it('can play multiple turns', () => {
    const game = createGame();

    for (let turn = 0; turn < 10; turn++) {
      const currentPlayer = game.getPlayersTurn();
      const pieces = game.state.getAllPiecesFrom(currentPlayer);

      let played = false;
      for (const piece of pieces) {
        const moves = piece.moveSet.getPossibleMoves();
        if (moves.length > 0) {
          const success = game.play(piece.pos, moves[0]);
          if (success) {
            played = true;
            break;
          }
        }
      }

      if (!played || game.getWinner()) break;
    }

    expect(game.getTurns()).toBeGreaterThan(0);
  });
});
