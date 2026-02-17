import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { SwapEvent } from '../../../events/events/SwapEvent';

export class SwapPositionsAct extends PieceAct {
  performWithoutChain(state: GameOperator, pos1: Pos, pos2: Pos): void {
    const piece = state.pieceAt(pos1);
    const targetPiece = state.pieceAt(pos2);
    if (targetPiece && piece) {
      if (targetPiece.owner === piece.owner) {
        state.performEvent(new SwapEvent(pos1, pos2));
      }
    }
  }
}
