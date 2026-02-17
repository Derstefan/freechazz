import type { Game } from '../engine/game/Game';
import type { EPlayer } from '../engine/core/EPlayer';
import type { Pos } from '../engine/core/Pos';
import { SeededRandom } from '../engine/generators/SeededRandom';

export interface DrawData {
  fromPos: Pos;
  toPos: Pos;
}

export abstract class Bot {
  protected readonly player: EPlayer;
  protected readonly rand: SeededRandom;
  protected drawsCounter: number = 0;

  constructor(player: EPlayer, seed?: number) {
    this.player = player;
    this.rand = new SeededRandom(seed ?? Math.floor(Math.random() * 1213987));
  }

  getPlayer(): EPlayer {
    return this.player;
  }

  doDrawOn(game: Game): DrawData | null {
    this.drawsCounter = 0;
    return this.doDraw(game);
  }

  protected abstract doDraw(game: Game): DrawData | null;

  protected newDraw(): void {
    this.drawsCounter++;
  }

  protected randomDraw(draws: DrawData[]): DrawData {
    if (draws.length === 0) throw new Error('Draws list is empty');
    const index = Math.floor(this.rand.next() * draws.length);
    return draws[index];
  }

  static diff(list1: any[], list2: any[]): any[] {
    return list1.filter(el => !list2.includes(el));
  }

  static getBestDrawsWithTolerance(
    draws: Map<DrawData, number>,
    tolerance: number,
  ): DrawData[] {
    if (tolerance > 1 || tolerance < 0) {
      throw new Error('Tolerance must be between 0 and 1');
    }

    let bestValue = -Number.MAX_VALUE;
    for (const value of draws.values()) {
      if (value > bestValue) bestValue = value;
    }

    const bestDraws: DrawData[] = [];
    for (const [draw, value] of draws.entries()) {
      if (value >= bestValue - Math.abs(bestValue * tolerance)) {
        bestDraws.push(draw);
      }
    }
    return bestDraws;
  }
}
