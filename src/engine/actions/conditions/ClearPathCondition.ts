import { Condition } from '../Condition';
import type { GameOperator } from '../../state/GameOperator';
import { Pos } from '../../core/Pos';

export class ClearPathCondition extends Condition {
  check(board: GameOperator, pos1: Pos, pos2: Pos): boolean {
    if (pos1.equals(pos2)) return false;

    const dy = pos1.y - pos2.y;
    const dx = pos1.x - pos2.x;
    const l = Math.max(Math.abs(dy), Math.abs(dx));

    let x = pos1.x;
    let y = pos1.y;

    for (let i = 1; i < l; i++) {
      x -= Math.trunc(dx / l);
      y -= Math.trunc(dy / l);
      if (!board.isFree(new Pos(x, y))) {
        return false;
      }
    }
    return true;
  }
}
