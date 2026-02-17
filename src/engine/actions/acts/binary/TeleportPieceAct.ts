import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';

export class TeleportPieceAct extends PieceAct {
  performWithoutChain(board: GameOperator, _pos1: Pos, pos2: Pos): void {
    ACTS.TELEPORT_INVERSE_ACT.performWithoutChain(board, pos2);
  }
}
