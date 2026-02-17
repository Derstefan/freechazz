import { Bot, type DrawData } from './Bot';
import type { Game } from '../engine/game/Game';
import { EPlayer, getOpponent } from '../engine/core/EPlayer';
import type { Piece } from '../engine/pieces/Piece';

const NOTHING = 0;
const BEAT = 30;
const LOSE = 15;
const KING = 1885;
const MOVE_TO_ENEMY = 10;
const MIN_DRAWS_CHECKING = 7;
const MIN_DRAWS_CHECKING_HISTORY = 4;
const MIN_DRAWS_CHECKING_DEEP = 5;
const MIN_DRAWS_CHECKING_HISTORY_DEEP = 4;
const TOLERANCE = 0.2;

export class BetterBotClean extends Bot {
  private maxDepth: number;

  constructor(player: EPlayer, maxDepth: number, seed?: number) {
    super(player, seed);
    this.maxDepth = maxDepth;
  }

  protected doDraw(game: Game): DrawData | null {
    const evaluatedDraws = this.evaluateDraws(game);
    if (evaluatedDraws.size === 0) {
      return null; // surrender
    }
    const bestDraws = Bot.getBestDrawsWithTolerance(evaluatedDraws, TOLERANCE);
    return this.randomDraw(bestDraws);
  }

  private evaluateDraws(game: Game): Map<DrawData, number> {
    const gameCopy = game.copy();
    const drawValues = new Map<DrawData, number>();
    const draws = this.getDraws(game, game.getPlayersTurn());
    if (draws.length === 0) return drawValues;

    let bestValue = -Number.MAX_VALUE / 4;
    let drawCounter = 0;
    let lastGoodDraw = 0;

    for (const draw of draws) {
      const value = this.emulateOwnDraw(gameCopy, draw, this.maxDepth);
      if (value > bestValue) {
        bestValue = value;
        lastGoodDraw = drawCounter;
      }
      if (value <= -Number.MAX_VALUE / 4) {
        drawCounter++;
        continue;
      }
      drawValues.set(draw, value);
      if (value === Number.MAX_VALUE) return drawValues;
      if (drawCounter > MIN_DRAWS_CHECKING && drawCounter - lastGoodDraw > MIN_DRAWS_CHECKING_HISTORY) {
        break;
      }
      drawCounter++;
    }

    if (drawValues.size === 0) {
      if (draws.length === 0) return drawValues;
      drawValues.set(this.randomDraw(draws), 0);
      return drawValues;
    }
    return drawValues;
  }

  private emulateOwnDraw(game: Game, drawData: DrawData, depth: number): number {
    const graveYardBefore = [...game.state.graveyard];

    game.play(drawData.fromPos, drawData.toPos);
    this.newDraw();

    const graveYardAfter = game.state.graveyard;

    let sum = this.weightOf(this.evaluateDraw(game, drawData, graveYardBefore, graveYardAfter), depth);

    if (depth === this.maxDepth && sum >= this.weightOf(KING, this.maxDepth) / 2) {
      game.undo();
      return Number.MAX_VALUE;
    }
    if (depth === this.maxDepth - 1 && sum <= -this.weightOf(KING, this.maxDepth - 1) / 2) {
      game.undo();
      return -Number.MAX_VALUE / 2;
    }

    if (depth === 0) {
      game.undo();
      return sum;
    }

    const opponentDraws = this.getDraws(game, game.getPlayersTurn());
    if (opponentDraws.length === 0) {
      game.undo();
      return -Number.MAX_VALUE / 4;
    }

    let bestValue = -1000000;
    let drawCounter = 1;
    let lastGoodDraw = 0;
    let tempSum = 0;

    for (const d of opponentDraws) {
      const value = this.emulateEnemyDraw(game, d, depth - 1);
      tempSum += value;
      if (value > bestValue) {
        bestValue = value;
        lastGoodDraw = drawCounter;
      }
      drawCounter++;
      if (drawCounter > MIN_DRAWS_CHECKING_DEEP && drawCounter - lastGoodDraw > MIN_DRAWS_CHECKING_HISTORY_DEEP) {
        break;
      }
    }

    sum += tempSum / drawCounter;
    game.undo();
    return sum;
  }

  private emulateEnemyDraw(game: Game, drawData: DrawData, depth: number): number {
    const graveYardBefore = [...game.state.graveyard];

    game.play(drawData.fromPos, drawData.toPos);
    this.newDraw();

    const graveYardAfter = game.state.graveyard;

    let sum = this.weightOf(this.evaluateDraw(game, drawData, graveYardBefore, graveYardAfter), depth);

    if (depth === this.maxDepth && sum >= this.weightOf(KING, this.maxDepth) / 2) {
      game.undo();
      return Number.MAX_VALUE;
    }
    if (depth === this.maxDepth - 1 && sum <= -this.weightOf(KING, this.maxDepth - 1) / 2) {
      game.undo();
      return -Number.MAX_VALUE / 2;
    }

    if (depth === 0) {
      game.undo();
      return sum;
    }

    const opponentDraws = this.getDraws(game, game.getPlayersTurn());
    if (opponentDraws.length === 0) {
      game.undo();
      return -Number.MAX_VALUE / 4;
    }

    let bestValue = 1000000;
    let drawCounter = 1;
    let lastGoodDraw = 0;
    let tempSum = 0;

    for (const d of opponentDraws) {
      const value = this.emulateOwnDraw(game, d, depth - 1);
      tempSum += value;
      if (value < bestValue) {
        bestValue = value;
        lastGoodDraw = drawCounter;
      }
      drawCounter++;
      if (drawCounter > MIN_DRAWS_CHECKING_DEEP && drawCounter - lastGoodDraw > MIN_DRAWS_CHECKING_HISTORY_DEEP) {
        break;
      }
    }

    sum += tempSum / drawCounter;
    game.undo();
    return sum;
  }

  private getDraws(game: Game, player: EPlayer): DrawData[] {
    const draws: DrawData[] = [];
    const pieces = game.state.getAllPiecesFrom(player);

    for (const p of pieces) {
      for (const pos of p.moveSet.getPossibleMoves()) {
        draws.push({ fromPos: p.pos, toPos: pos });
      }
    }

    this.sortDrawData(draws, game);
    return draws;
  }

  private sortDrawData(draws: DrawData[], game: Game): void {
    if (draws.length === 0) return;

    const firstPiece = game.state.pieceAt(draws[0].fromPos);
    if (!firstPiece) return;
    const enemy = getOpponent(firstPiece.owner);

    draws.sort((d1, d2) => {
      return game.state.distanceToEnemy(enemy, d1.toPos) - game.state.distanceToEnemy(enemy, d2.toPos);
    });
  }

  private evaluateDraw(
    game: Game,
    drawData: DrawData,
    graveYardBefore: Piece[],
    graveYardAfter: Piece[],
  ): number {
    let sum = NOTHING;

    const moveValue = game.state.distanceToEnemy(getOpponent(this.player), drawData.fromPos)
      - game.state.distanceToEnemy(getOpponent(this.player), drawData.toPos);

    if (moveValue > 0) {
      sum += MOVE_TO_ENEMY;
    } else if (moveValue < 0) {
      sum -= MOVE_TO_ENEMY;
    }

    const removedPieces = Bot.diff(graveYardAfter, graveYardBefore);
    for (const removedPiece of removedPieces) {
      sum += this.evaluateRemovedPiece(removedPiece);
    }

    return sum;
  }

  private evaluateRemovedPiece(p: Piece): number {
    if (p.king) {
      if (this.player === p.owner) {
        return -KING;
      }
      return KING;
    } else {
      if (this.player === p.owner) {
        return -LOSE;
      }
      return BEAT;
    }
  }

  private weightOf(value: number, depth: number): number {
    const divisor = this.maxDepth - depth + 1;
    return value / divisor / divisor;
  }
}
