import type { PieceType } from '../pieces/PieceType';
import { PieceTypePool } from './PieceTypePool';
import { PieceTypeGeneratorRouter } from './PieceTypeGenerator';
import { SeededRandom } from './SeededRandom';

const MAX_LVL = 5;
const DEFAULT_POOL_SIZE = 5;

export class PiecePoolGenerator {
  private rand: SeededRandom;
  private gen = new PieceTypeGeneratorRouter();
  private symbolCounter = 100; // ASCII start

  constructor(seed: number) {
    this.rand = new SeededRandom(seed);
  }

  generate(poolSize: number = DEFAULT_POOL_SIZE): PieceTypePool {
    const pool = new PieceTypePool(MAX_LVL, this.rand.nextLong());
    for (let lvl = 1; lvl <= MAX_LVL; lvl++) {
      for (let i = 0; i < poolSize; i++) {
        pool.get(lvl).push(this.generatePiece(lvl, this.rand.nextLong()));
      }
    }
    return pool;
  }

  private generatePiece(lvl: number, seed: number): PieceType {
    const pieceType = this.gen.generate(lvl, seed, 'V1');
    pieceType.symbol = String.fromCharCode(this.symbolCounter);
    this.symbolCounter++;
    return pieceType;
  }
}
