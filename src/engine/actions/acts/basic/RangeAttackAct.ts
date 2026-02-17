import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';

export class RangeAttackAct extends PieceAct {
  performWithoutChain(board: GameOperator, _pos1: Pos, pos2: Pos): void {
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos2);
  }
}
