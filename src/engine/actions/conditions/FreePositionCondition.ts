import { UnitaryCondition } from '../Condition';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';

export class FreePositionCondition extends UnitaryCondition {
  protected checkUnitary(board: GameOperator, pos: Pos): boolean {
    return board.pieceAt(pos) === null;
  }
}
