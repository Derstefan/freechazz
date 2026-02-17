import { Act } from './Act';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';

export abstract class PosAct extends Act {
  abstract performWithoutChain(board: GameOperator, pos: Pos): void;

  perform(board: GameOperator, pos: Pos): void {
    this.performWithoutChain(board, pos);
    if (this.connector) {
      this.connector.performUnitary(board, pos);
    }
  }

  copy(): PosAct {
    const clone = Object.create(Object.getPrototypeOf(this));
    clone.connector = null;
    return clone;
  }
}
