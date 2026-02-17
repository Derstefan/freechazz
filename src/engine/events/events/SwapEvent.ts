import { Event, EventType } from '../Event';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';

export class SwapEvent extends Event {
  constructor(
    public readonly fromPos: Pos,
    public readonly toPos: Pos,
  ) {
    super(EventType.SWAP);
  }

  perform(state: GameOperator): void {
    const p1 = state.pieceAt(this.fromPos);
    const p2 = state.pieceAt(this.toPos);
    if (!p1 || !p2) return;
    state.removePiece(this.fromPos);
    state.removePiece(this.toPos);
    state.putPiece(p1, this.toPos);
    state.putPiece(p2, this.fromPos);
  }

  undo(state: GameOperator): void {
    const p2 = state.pieceAt(this.fromPos);
    const p1 = state.pieceAt(this.toPos);
    if (!p1 || !p2) return;
    state.removePiece(this.fromPos);
    state.removePiece(this.toPos);
    state.putPiece(p1, this.fromPos);
    state.putPiece(p2, this.toPos);
  }
}
