import { Act } from './Act';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';

export abstract class PieceAct extends Act {
  abstract performWithoutChain(board: GameOperator, fromPos: Pos, toPos: Pos): void;

  perform(board: GameOperator, fromPos: Pos, toPos: Pos): void {
    this.performWithoutChain(board, fromPos, toPos);
    if (this.connector) {
      this.connector.performBinary(board, fromPos, toPos);
    }
  }

  copy(): PieceAct {
    // Create new instance of same type - subclasses should override if they have state
    const clone = Object.create(Object.getPrototypeOf(this));
    clone.connector = null;
    return clone;
  }
}
