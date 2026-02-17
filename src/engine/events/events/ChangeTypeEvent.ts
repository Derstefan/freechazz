import { Event, EventType } from '../Event';
import type { GameOperator } from '../../state/GameOperator';
import type { Piece } from '../../pieces/Piece';
import type { PieceType } from '../../pieces/PieceType';

export class ChangeTypeEvent extends Event {
  constructor(
    public readonly piece: Piece,
    public readonly oldType: PieceType,
    public readonly newType: PieceType,
  ) {
    super(EventType.CHANGE_TYPE);
  }

  perform(_state: GameOperator): void {
    this.piece.pieceType = this.newType;
  }

  undo(_state: GameOperator): void {
    this.piece.pieceType = this.oldType;
  }
}
