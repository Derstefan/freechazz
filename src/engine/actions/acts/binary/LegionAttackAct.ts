import { PieceAct } from '../PieceAct';
import type { GameOperator } from '../../../state/GameOperator';
import type { Pos } from '../../../core/Pos';
import { ACTS } from '../Acts';
import { ACTIONS } from '../Actions';

export class LegionAttackAct extends PieceAct {
  performWithoutChain(board: GameOperator, pos1: Pos, pos2: Pos): void {
    const piece = board.pieceAt(pos1);
    if (!piece) return;
    const owner = piece.owner;
    const diff = pos2.minus(pos1);

    // initiator moves first
    ACTS.MOVE_OR_ATTACK.perform(board, pos1, pos2);

    // all same-type pieces follow
    const allies = [...board.getAllPiecesFrom(owner)];
    for (const p of allies) {
      if (p.id === piece.id) continue;
      if (p.symbol === piece.symbol && board.isOnboard(p.pos.plus(diff))) {
        ACTIONS.MOVE_OR_ATTACK_ACTION.perform(board, p.pos, p.pos.plus(diff));
      }
    }
  }
}
