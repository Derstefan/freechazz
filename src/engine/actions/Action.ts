import type { Condition } from './Condition';
import { TrivCondition } from './Condition';
import type { PieceAct } from './acts/PieceAct';
import type { GameOperator } from '../state/GameOperator';
import type { Pos } from '../core/Pos';

export class Action {
  condition: Condition;
  act: PieceAct;
  symbol: string;

  constructor(condition: Condition, act: PieceAct, symbol: string = '') {
    this.condition = condition;
    this.act = act;
    this.symbol = symbol;
  }

  static simple(act: PieceAct): Action {
    return new Action(new TrivCondition(), act);
  }

  checkCondition(board: GameOperator, pos1: Pos, pos2: Pos): boolean {
    return this.condition.check(board, pos1, pos2);
  }

  perform(board: GameOperator, pos1: Pos, pos2: Pos): void {
    if (this.checkCondition(board, pos1, pos2)) {
      this.act.perform(board, pos1, pos2);
    }
  }

  performWithoutChain(board: GameOperator, pos1: Pos, pos2: Pos): void {
    if (this.checkCondition(board, pos1, pos2)) {
      this.act.performWithoutChain(board, pos1, pos2);
    }
  }

  copy(): Action {
    return new Action(this.condition, this.act.copy(), this.symbol);
  }
}
