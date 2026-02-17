import { UnitaryCondition } from '../Condition';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';

export class IsNoKingCondition extends UnitaryCondition {
  protected checkUnitary(board: GameOperator, pos: Pos): boolean {
    const p = board.pieceAt(pos);
    if (!p) return false;
    return !p.king;
  }
}
