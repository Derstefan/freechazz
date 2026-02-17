import { Condition } from '../Condition';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';

export class EnemyAtPositionCondition extends Condition {
  check(board: GameOperator, pos1: Pos, pos2: Pos): boolean {
    return board.areEnemies(board.pieceAt(pos1), board.pieceAt(pos2));
  }
}
