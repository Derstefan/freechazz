import { PosAct } from '../PosAct';
import type { GameOperator } from '../../../state/GameOperator';
import { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';

export class TeleportInverseAct extends PosAct {
  performWithoutChain(board: GameOperator, pos: Pos): void {
    const piece = board.pieceAt(pos);
    if (!piece) return;
    const invPos = new Pos(board.width - 1 - pos.x, board.height - 1 - pos.y);
    ACTS.MOVE_OR_ATTACK.perform(board, pos, invPos);
  }
}
