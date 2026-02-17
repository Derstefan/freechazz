import { ForceActionAct, ForceType } from '../ForceActionAct';
import type { GameOperator } from '../../../state/GameOperator';
import { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';

export class RangedAttackCrossAct extends ForceActionAct {
  constructor(forceType: ForceType = ForceType.ANY_PIECE) {
    super(forceType);
  }

  performWithoutChain(board: GameOperator, pos: Pos): void {
    if (board.isOnboard(pos) && board.isFree(pos)) return;

    this.performChainAct(board, ACTS.RANGE_ATTACK_ACT.copy(), pos, pos.add(-2, 0));
    this.performChainAct(board, ACTS.RANGE_ATTACK_ACT.copy(), pos, pos.add(0, -2));
    this.performChainAct(board, ACTS.RANGE_ATTACK_ACT.copy(), pos, pos.add(2, 0));
    this.performChainAct(board, ACTS.RANGE_ATTACK_ACT.copy(), pos, pos.add(0, 2));
  }
}
