import { Event, EventType } from '../Event';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';
import type { Piece } from '../../pieces/Piece';

export class MoveAndDestroyEvent extends Event {
  constructor(
    public readonly fromPos: Pos,
    public readonly piece: Piece,
    public readonly toPos: Pos,
    public readonly targetPiece: Piece,
  ) {
    super(EventType.MOVE_AND_DESTROY);
  }

  perform(state: GameOperator): void {
    const targetPiece = state.pieceAt(this.toPos);
    const piece = state.pieceAt(this.fromPos);
    if (!targetPiece || !piece) return;

    if (targetPiece === state.king1 && state.king2) {
      state.setWinner(state.king2.owner);
    } else if (targetPiece === state.king2 && state.king1) {
      state.setWinner(state.king1.owner);
    }
    state.removePiece(this.toPos);
    state.graveyard.push(targetPiece);
    state.removePiece(this.fromPos);
    state.putPiece(piece, this.toPos);
  }

  undo(state: GameOperator): void {
    state.removePiece(this.toPos);
    state.putPiece(this.piece, this.fromPos);
    const idx = state.graveyard.indexOf(this.targetPiece);
    if (idx >= 0) state.graveyard.splice(idx, 1);
    state.putPiece(this.targetPiece, this.toPos);
  }
}
