import { ForceActionAct, ForceType } from '../ForceActionAct';
import type { GameOperator } from '../../../state/GameOperator';
import { Pos } from '../../../core/Pos';
import type { Piece } from '../../../pieces/Piece';
import { PieceType } from '../../../pieces/PieceType';
import { SeededRandom } from '../../../generators/SeededRandom';

export class RandomActionPrefAttackAct extends ForceActionAct {
  constructor(forceType: ForceType = ForceType.ANY_PIECE) {
    super(forceType);
  }

  performWithoutChain(operator: GameOperator, pos: Pos): void {
    if (!operator.isOnboard(pos) || operator.isFree(pos)) return;

    const piece = operator.pieceAt(pos);
    if (!piece) return;

    operator.computePossibleMovesForPiece(piece);
    const randomPos = this.getRandomMovePrefAttack(operator, piece);
    if (!randomPos) return;
    if (!piece.isPossibleMove(randomPos)) return;

    const topDown = piece.owner === PieceType.TOPDOWN_PLAYER;
    let dPos = randomPos.minus(pos);
    if (topDown) dPos = dPos.invertY();

    const action = piece.pieceType.actionMap.get(dPos);
    if (!action) return;

    this.performChainAct(operator, action.act, pos, randomPos);
  }

  private getRandomMovePrefAttack(operator: GameOperator, piece: Piece): Pos | null {
    const rng = new SeededRandom(piece.pos.x * piece.pos.y + operator.getAllPieces().length);
    const possibleMoves = piece.moveSet.getPossibleMoves();
    if (possibleMoves.length === 0) return null;

    const possibleAttacks: Pos[] = [];
    for (const p of possibleMoves) {
      if (operator.isFree(p)) continue;
      const target = operator.pieceAt(p);
      if (target && operator.areEnemies(piece, target)) {
        possibleAttacks.push(p);
      }
    }

    if (possibleAttacks.length > 0) {
      return possibleAttacks[Math.floor(rng.next() * possibleAttacks.length)];
    }

    return possibleMoves[Math.floor(rng.next() * possibleMoves.length)];
  }
}
