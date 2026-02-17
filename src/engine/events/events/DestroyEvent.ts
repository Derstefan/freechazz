import { Event, EventType } from '../Event';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';
import type { Piece } from '../../pieces/Piece';

export class DestroyEvent extends Event {
  constructor(
    public readonly piece: Piece,
    public readonly pos: Pos,
  ) {
    super(EventType.DESTROY);
  }

  perform(state: GameOperator): void {
    const p = state.pieceAt(this.pos);
    if (!p) return;
    if (p === state.king1 && state.king2) {
      state.setWinner(state.king2.owner);
    } else if (p === state.king2 && state.king1) {
      state.setWinner(state.king1.owner);
    }
    state.removePiece(this.pos);
    state.graveyard.push(p);
  }

  undo(state: GameOperator): void {
    const idx = state.graveyard.indexOf(this.piece);
    if (idx >= 0) state.graveyard.splice(idx, 1);
    state.putPiece(this.piece, this.pos);
  }
}
