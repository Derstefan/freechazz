import { ForceActionAct, ForceType } from '../ForceActionAct';
import type { GameOperator } from '../../../state/GameOperator';
import { Pos } from '../../../core/Pos';
import { PieceType } from '../../../pieces/PieceType';
import { SeededRandom } from '../../../generators/SeededRandom';

export class RandomActionAct extends ForceActionAct {
  constructor(forceType: ForceType = ForceType.ANY_PIECE) {
    super(forceType);
  }

  performWithoutChain(board: GameOperator, pos: Pos): void {
    if (!board.isOnboard(pos) || board.isFree(pos)) return;

    const piece = board.pieceAt(pos);
    if (!piece) return;

    board.computePossibleMovesForPiece(piece);
    const randomPos = this.getRandomMove(board, piece);
    if (!randomPos) return;

    const topDown = piece.owner === PieceType.TOPDOWN_PLAYER;
    let dPos = randomPos.minus(pos);
    if (topDown) dPos = dPos.invertY();

    const action = piece.pieceType.actionMap.get(dPos);
    if (!action) return;

    this.performChainAct(board, action.act, pos, randomPos);
  }

  private getRandomMove(operator: GameOperator, piece: { moveSet: { getPossibleMoves(): Pos[] }; pos: Pos }): Pos | null {
    const moves = piece.moveSet.getPossibleMoves();
    if (moves.length === 0) return null;
    const rng = new SeededRandom(piece.pos.x * piece.pos.y + operator.getAllPieces().length);
    const idx = Math.floor(rng.next() * moves.length);
    return moves[idx];
  }
}
