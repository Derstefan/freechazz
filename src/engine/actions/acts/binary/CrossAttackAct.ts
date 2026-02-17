import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';

export class CrossAttackAct extends PieceAct {
  performWithoutChain(board: GameOperator, pos1: Pos, pos2: Pos): void {
    const piece = board.pieceAt(pos1);
    if (!piece) return;
    const owner = piece.owner;

    const ps = [
      board.pieceAt(pos2.add(1, 1)),
      board.pieceAt(pos2.add(-1, 1)),
      board.pieceAt(pos2.add(1, -1)),
      board.pieceAt(pos2.add(-1, -1)),
    ];

    for (const p of ps) {
      if (p && p.owner !== owner) {
        ACTS.DESTROY_PIECE_ACT.performWithoutChain(board, p.pos);
      }
    }

    ACTS.MOVE_ACT.perform(board, pos1, pos2);
  }
}
