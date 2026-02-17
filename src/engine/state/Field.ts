import type { Piece } from '../pieces/Piece';

export class Field {
  piece: Piece | null;

  constructor(piece: Piece | null = null) {
    this.piece = piece;
  }
}
