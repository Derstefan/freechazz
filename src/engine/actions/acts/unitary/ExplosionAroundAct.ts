import { PosAct } from '../PosAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';

export class ExplosionAroundAct extends PosAct {
  performWithoutChain(board: GameOperator, pos: Pos): void {
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(-1, -1));
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(0, -1));
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(1, -1));
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(-1, 0));
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(0, 0));
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(1, 0));
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(-1, 1));
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(0, 1));
    ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, pos.add(1, 1));
  }
}
