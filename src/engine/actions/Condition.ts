import type { GameOperator } from '../state/GameOperator';
import type { Pos } from '../core/Pos';

export abstract class Condition {
  abstract check(board: GameOperator, pos1: Pos, pos2: Pos): boolean;

  AND(cond2: Condition): AndCondition {
    return new AndCondition(this, cond2);
  }

  OR(cond2: Condition): OrCondition {
    return new OrCondition(this, cond2);
  }

  NOT(): NotCondition {
    return new NotCondition(this);
  }
}

export abstract class UnitaryCondition extends Condition {
  protected abstract checkUnitary(board: GameOperator, pos: Pos): boolean;

  check(board: GameOperator, pos1: Pos, pos2: Pos): boolean {
    return this.checkUnitary(board, pos2);
  }
}

export class AndCondition extends Condition {
  constructor(private cond1: Condition, private cond2: Condition) {
    super();
  }
  check(board: GameOperator, pos1: Pos, pos2: Pos): boolean {
    return this.cond1.check(board, pos1, pos2) && this.cond2.check(board, pos1, pos2);
  }
}

export class OrCondition extends Condition {
  constructor(private cond1: Condition, private cond2: Condition) {
    super();
  }
  check(board: GameOperator, pos1: Pos, pos2: Pos): boolean {
    return this.cond1.check(board, pos1, pos2) || this.cond2.check(board, pos1, pos2);
  }
}

export class NotCondition extends Condition {
  constructor(private cond: Condition) {
    super();
  }
  check(board: GameOperator, pos1: Pos, pos2: Pos): boolean {
    return !this.cond.check(board, pos1, pos2);
  }
}

export class TrivCondition extends Condition {
  check(_board: GameOperator, _pos1: Pos, _pos2: Pos): boolean {
    return true;
  }
}
