import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';
import { DestroyEvent } from '../../../events/events/DestroyEvent';

export class RushAct extends PieceAct {
  performWithoutChain(state: GameOperator, fromPos: Pos, toPos: Pos): void {
    if (fromPos.equals(toPos)) return;

    const dy = fromPos.y - toPos.y;
    const dx = fromPos.x - toPos.x;
    const l = Math.max(Math.abs(dy), Math.abs(dx));

    let x = fromPos.x;
    let y = fromPos.y;

    ACTS.MOVE_OR_ATTACK.perform(state, fromPos, toPos);
    for (let i = 1; i < l; i++) {
      x -= Math.trunc(dx / l);
      y -= Math.trunc(dy / l);
      const pos = new Pos(x, y);
      if (!state.isFree(pos)) {
        const targetPiece = state.pieceAt(pos);
        if (targetPiece) {
          state.performEvent(new DestroyEvent(targetPiece, pos));
        }
      }
    }
  }
}
