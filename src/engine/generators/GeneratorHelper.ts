import { Pos } from '../core/Pos';
import type { PieceType } from '../pieces/PieceType';
import type { SeededRandom } from './SeededRandom';

export function dice(wsks: number[], rand: SeededRandom): number {
  let wsk = rand.next();
  for (let i = 0; i < wsks.length; i++) {
    if (wsk <= wsks[i]) return i;
    wsk -= wsks[i];
  }
  return wsks.length - 1;
}

export function getRandomPosOfArea(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  number: number,
  rand: SeededRandom,
): Pos[] {
  const allPositions: Pos[] = [];
  for (let i = minX; i <= maxX; i++) {
    for (let j = minY; j <= maxY; j++) {
      allPositions.push(new Pos(i, j));
    }
  }

  const count = Math.min(number, allPositions.length);
  const positions: Pos[] = [];

  for (let i = 0; i < count; i++) {
    const k = Math.floor(rand.next() * allPositions.length);
    positions.push(allPositions[k]);
    allPositions.splice(k, 1);
  }

  return positions;
}

export function getRandomEntryOf(pieceTypes: PieceType[], rand: SeededRandom): PieceType {
  const index = rand.nextInt(pieceTypes.length);
  return pieceTypes[index];
}
