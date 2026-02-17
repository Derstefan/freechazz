import { ForceActionAct, ForceType } from '../ForceActionAct';
import type { GameOperator } from '../../../state/GameOperator';
import { Pos } from '../../../core/Pos';
import type { Piece } from '../../../pieces/Piece';
import { PieceType } from '../../../pieces/PieceType';
import { getOpponent } from '../../../core/EPlayer';
import { SeededRandom } from '../../../generators/SeededRandom';

export class RandomActionPrefFleeAct extends ForceActionAct {
  constructor(forceType: ForceType = ForceType.ANY_PIECE) {
    super(forceType);
  }

  performWithoutChain(operator: GameOperator, pos: Pos): void {
    if (!operator.isOnboard(pos) || operator.isFree(pos)) return;

    const piece = operator.pieceAt(pos);
    if (!piece) return;

    operator.computePossibleMovesForPiece(piece);
    const randomPos = this.getRandomMovePrefFlee(operator, piece);
    if (!randomPos) return;

    const topDown = piece.owner === PieceType.TOPDOWN_PLAYER;
    let dPos = randomPos.minus(pos);
    if (topDown) dPos = dPos.invertY();

    const action = piece.pieceType.actionMap.get(dPos);
    if (!action) return;

    this.performChainAct(operator, action.act, pos, randomPos);
  }

  private getRandomMovePrefFlee(operator: GameOperator, piece: Piece): Pos | null {
    const rng = new SeededRandom(piece.pos.x * piece.pos.y + operator.getAllPieces().length);
    const possibleMoves = piece.moveSet.getPossibleMoves();
    if (possibleMoves.length === 0) return null;

    let maxDistance = 0;
    for (const p of possibleMoves) {
      const distance = operator.distanceToEnemy(getOpponent(piece.owner), p);
      if (distance > maxDistance) maxDistance = distance;
    }

    const possibleFleeing: Pos[] = [];
    for (const p of possibleMoves) {
      const distance = operator.distanceToEnemy(getOpponent(piece.owner), p);
      if (distance === maxDistance) {
        possibleFleeing.push(p);
      }
    }

    if (possibleFleeing.length === 0) return null;
    return possibleFleeing[Math.floor(rng.next() * possibleFleeing.length)];
  }
}
