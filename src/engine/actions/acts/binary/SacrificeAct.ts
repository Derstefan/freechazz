import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';

export class SacrificeAct extends PieceAct {
  performWithoutChain(_board: GameOperator, _pos1: Pos, _pos2: Pos): void {
    // TODO: sacrifice and then something happens
  }
}
