import { Formation } from '../formation/Formation';
import { FormationBuilder } from '../formation/FormationBuilder';
import { Pos } from '../core/Pos';
import type { BoardSize } from '../core/ESize';
import { ESize } from '../core/ESize';
import { PiecePoolGenerator } from './PiecePoolGenerator';
import type { PieceTypePool } from './PieceTypePool';
import type { PieceType } from '../pieces/PieceType';
import { SeededRandom } from './SeededRandom';
import { getRandomPosOfArea, getRandomEntryOf } from './GeneratorHelper';

const KING_LVL = 1;

function kingPos(size: BoardSize): Pos {
  return new Pos(Math.floor(size.width / 2), 0);
}

export class FormationGenerator {
  private size: BoardSize;
  private rand: SeededRandom;
  private pieceTypePool: PieceTypePool;
  private formationBuilder: FormationBuilder;

  constructor(seed: number, size: BoardSize) {
    this.rand = new SeededRandom(seed);
    this.size = size;
    const poolSize = FormationGenerator.poolSizeFor(size);
    this.pieceTypePool = new PiecePoolGenerator(this.rand.nextLong()).generate(poolSize);
    this.formationBuilder = new FormationBuilder(size);
  }

  private static poolSizeFor(size: BoardSize): number {
    if (size.width >= 500) return 25;
    if (size.width >= 100) return 15;
    if (size.width >= 50) return 10;
    return 5;
  }

  generate(): Formation {
    const kingType = this.pieceTypePool.getRandomPieceType(KING_LVL);
    const kPos = kingPos(this.size);
    this.formationBuilder.putKing(kingType, kPos);
    this.putPieces();
    return this.formationBuilder.build();
  }

  private putPieces(): void {
    if (this.size.name === 'gigantic') {
      // 500x200, halfH=100 → lines must be <100
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(1500, 95));
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(1200, 85));
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(1000, 75));
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(800, 65));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(1000, 58));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(800, 50));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(600, 42));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(700, 35));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(500, 28));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(400, 22));
      this.addPiecesToBoard(this.pieceTypePool.get(4), this.randomPositions(400, 16));
      this.addPiecesToBoard(this.pieceTypePool.get(4), this.randomPositions(300, 11));
      this.addPiecesToBoard(this.pieceTypePool.get(5), this.randomPositions(200, 7));
      this.addPiecesToBoard(this.pieceTypePool.get(5), this.randomPositions(150, 3));
    } else if (this.size.name === 'massive') {
      // 100x50, halfH=25 → lines must be <25
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(300, 23));
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(250, 20));
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(200, 17));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(200, 15));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(180, 13));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(150, 11));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(120, 9));
      this.addPiecesToBoard(this.pieceTypePool.get(4), this.randomPositions(100, 7));
      this.addPiecesToBoard(this.pieceTypePool.get(4), this.randomPositions(80, 5));
      this.addPiecesToBoard(this.pieceTypePool.get(5), this.randomPositions(60, 3));
      this.addPiecesToBoard(this.pieceTypePool.get(5), this.randomPositions(40, 1));
    } else if (this.size.name === 'huge') {
      // 50x33, halfH=16 → lines must be <16
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(100, 14));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(80, 12));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(60, 9));
      this.addPiecesToBoard(this.pieceTypePool.get(4), this.randomPositions(40, 6));
      this.addPiecesToBoard(this.pieceTypePool.get(5), this.randomPositions(20, 3));
    } else if (this.size.name === 'big') {
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(27, 10));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(22, 9));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(14, 7));
      this.addPiecesToBoard(this.pieceTypePool.get(4), this.randomPositions(8, 5));
      this.addPiecesToBoard(this.pieceTypePool.get(5), this.randomPositions(4, 3));
    } else if (this.size.name === 'medium') {
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(14, 6));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(17, 5));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(8, 4));
      this.addPiecesToBoard(this.pieceTypePool.get(4), this.randomPositions(4, 2));
    } else if (this.size.name === 'small') {
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(8, 3));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(10, 2));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(4, 1));
    } else {
      // tiny
      this.addPiecesToBoard(this.pieceTypePool.get(1), this.randomPositions(4, 3));
      this.addPiecesToBoard(this.pieceTypePool.get(2), this.randomPositions(4, 2));
      this.addPiecesToBoard(this.pieceTypePool.get(3), this.randomPositions(5, 1));
    }
  }

  private randomPositions(number: number, line: number): Pos[] {
    const halfH = Math.floor(this.size.height / 2);
    if (line >= halfH || number <= 0) return [];
    return getRandomPosOfArea(
      0,
      this.size.width - 1,
      line,
      line + 1,
      number,
      this.rand,
    );
  }

  private addPiecesToBoard(pieceTypes: PieceType[], positions: Pos[]): void {
    for (const pos of positions) {
      const type = getRandomEntryOf(pieceTypes, this.rand);
      this.formationBuilder.putPiece(type, pos);
    }
  }
}
