import type { PieceType } from '../pieces/PieceType';
import { SeededRandom } from './SeededRandom';

export class PieceTypePool {
  private pool: Map<number, PieceType[]> = new Map();
  private rand: SeededRandom;

  constructor(maxLvl: number, seed: number) {
    this.rand = new SeededRandom(seed);
    for (let i = 1; i <= maxLvl; i++) {
      this.pool.set(i, []);
    }
  }

  getRandomPieceType(lvl: number): PieceType {
    const types = this.pool.get(lvl)!;
    return types[this.rand.nextInt(types.length)];
  }

  get(lvl: number): PieceType[] {
    return this.pool.get(lvl)!;
  }

  put(lvl: number, pieceTypes: PieceType[]): void {
    this.pool.set(lvl, pieceTypes);
  }
}
