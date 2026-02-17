import type { PieceType } from '../pieces/PieceType';
import type { Pos } from '../core/Pos';
import type { BoardSize } from '../core/ESize';

export class Formation {
  size: BoardSize;
  private pieceTypes: Map<string, PieceType> = new Map(); // key: "x,y"
  kingPos: Pos | null = null;

  constructor(size: BoardSize) {
    this.size = size;
  }

  put(pieceType: PieceType, pos: Pos): void {
    this.pieceTypes.set(pos.key, pieceType);
  }

  getPieceTypes(): Map<string, PieceType> {
    return this.pieceTypes;
  }

  getKing(): PieceType | null {
    if (!this.kingPos) return null;
    return this.pieceTypes.get(this.kingPos.key) ?? null;
  }

  getPieceTypeAt(pos: Pos): PieceType | null {
    return this.pieceTypes.get(pos.key) ?? null;
  }

  copy(): Formation {
    const f = new Formation(this.size);
    f.kingPos = this.kingPos;
    f.pieceTypes = new Map(this.pieceTypes);
    return f;
  }
}
