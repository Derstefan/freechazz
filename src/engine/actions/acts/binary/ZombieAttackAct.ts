import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { Piece } from '../../../pieces/Piece';
import { ChangeOwnerEvent } from '../../../events/events/ChangeOwnerEvent';
import { ChangeTypeEvent } from '../../../events/events/ChangeTypeEvent';

export class ZombieAttackAct extends PieceAct {
  performWithoutChain(state: GameOperator, fromPos: Pos, toPos: Pos): void {
    const piece = state.pieceAt(fromPos);
    const targetPiece = state.pieceAt(toPos);
    if (targetPiece && piece) {
      if (targetPiece.owner !== piece.owner) {
        const zombie = new Piece(piece.owner, piece.pieceType);
        state.performEvent(new ChangeOwnerEvent(zombie));
        state.performEvent(new ChangeTypeEvent(zombie, zombie.pieceType, piece.pieceType));
      }
    }
  }
}
