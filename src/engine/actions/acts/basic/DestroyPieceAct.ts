import { PosAct } from '../PosAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { DestroyEvent } from '../../../events/events/DestroyEvent';

export class DestroyPieceAct extends PosAct {
  performWithoutChain(state: GameOperator, pos: Pos): void {
    const targetPiece = state.pieceAt(pos);
    if (targetPiece) {
      state.performEvent(new DestroyEvent(targetPiece, pos));
    }
  }
}
