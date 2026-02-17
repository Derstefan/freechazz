import { Formation } from './Formation';
import type { PieceType } from '../pieces/PieceType';
import type { Pos } from '../core/Pos';
import type { BoardSize } from '../core/ESize';

export class FormationBuilder {
  private formation: Formation;
  private kingSet = false;

  constructor(size: BoardSize) {
    this.formation = new Formation(size);
  }

  putKing(pieceType: PieceType, pos: Pos): FormationBuilder {
    this.formation.kingPos = pos;
    this.formation.put(pieceType, pos);
    this.kingSet = true;
    return this;
  }

  putPiece(pieceType: PieceType, pos: Pos): FormationBuilder {
    this.formation.put(pieceType, pos);
    return this;
  }

  build(): Formation {
    if (!this.kingSet) {
      throw new Error('King not set');
    }
    return this.formation;
  }
}
