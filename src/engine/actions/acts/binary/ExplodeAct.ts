import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';

export class ExplodeAct extends PieceAct {
  performWithoutChain(board: GameOperator, pos1: Pos, pos2: Pos): void {
    ACTS.MOVE_ACT.performWithoutChain(board, pos1, pos2);
    ACTS.EXPLOSION_ACT.performWithoutChain(board, pos2);
  }
}
