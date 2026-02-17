import { Condition } from '../Condition';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';

export class FriendAtPositionCondition extends Condition {
  check(board: GameOperator, pos1: Pos, pos2: Pos): boolean {
    const p1 = board.pieceAt(pos1);
    const p2 = board.pieceAt(pos2);
    if (!p1 || !p2) return false;
    return !board.areEnemies(p1, p2);
  }
}
