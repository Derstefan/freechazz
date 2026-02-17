import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { MoveEvent } from '../../../events/events/MoveEvent';
import { MoveAndDestroyEvent } from '../../../events/events/MoveAndDestroyEvent';

export class MoveOrAttackAct extends PieceAct {
  performWithoutChain(state: GameOperator, fromPos: Pos, toPos: Pos): void {
    if (!state.isOnboard(toPos)) return;

    const piece = state.pieceAt(fromPos);
    const targetPiece = state.pieceAt(toPos);

    if (targetPiece !== null && piece !== null) {
      state.performEvent(new MoveAndDestroyEvent(fromPos, piece, toPos, targetPiece));
    }
    if (targetPiece === null && piece) {
      state.performEvent(new MoveEvent(fromPos, piece, toPos));
    }
  }
}
