import { Event, EventType } from '../Event';
import type { GameOperator } from '../../state/GameOperator';
import { getOpponent } from '../../core/EPlayer';
import type { Piece } from '../../pieces/Piece';

export class ChangeOwnerEvent extends Event {
  constructor(public readonly piece: Piece) {
    super(EventType.CHANGE_OWNER);
  }

  perform(_state: GameOperator): void {
    this.piece.owner = getOpponent(this.piece.owner);
  }

  undo(_state: GameOperator): void {
    this.piece.owner = getOpponent(this.piece.owner);
  }
}
