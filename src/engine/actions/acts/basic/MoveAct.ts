import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { MoveEvent } from '../../../events/events/MoveEvent';

export class MoveAct extends PieceAct {
  performWithoutChain(state: GameOperator, fromPos: Pos, toPos: Pos): void {
    const piece = state.pieceAt(fromPos);
    const targetPiece = state.pieceAt(toPos);
    if (targetPiece === null && piece) {
      state.performEvent(new MoveEvent(fromPos, piece, toPos));
    }
  }
}
