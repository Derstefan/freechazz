import { Event, EventType } from '../Event';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';
import type { Piece } from '../../pieces/Piece';

export class MoveEvent extends Event {
  constructor(
    public readonly fromPos: Pos,
    public readonly piece: Piece,
    public readonly toPos: Pos,
  ) {
    super(EventType.MOVE);
  }

  perform(state: GameOperator): void {
    const targetPiece = state.pieceAt(this.toPos);
    const piece = state.pieceAt(this.fromPos);
    if (targetPiece === null && piece) {
      state.removePiece(this.fromPos);
      state.putPiece(piece, this.toPos);
    }
  }

  undo(state: GameOperator): void {
    state.removePiece(this.toPos);
    state.putPiece(this.piece, this.fromPos);
  }
}
