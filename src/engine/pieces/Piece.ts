import { EPlayer } from '../core/EPlayer';
import type { PieceType } from './PieceType';
import type { Pos } from '../core/Pos';
import { MoveSet } from './MoveSet';
import type { ActionPos } from '../core/ActionPos';

let nextId = 0;

export class Piece {
  id: number;
  pieceType: PieceType;
  position: Pos | null = null;
  king: boolean = false;
  owner: EPlayer;
  moveSet: MoveSet = new MoveSet();

  // temporary cached data for bot
  distanceToEnemy: number = 0;
  distanceToEnemyKing: number = 0;
  distanceToOwnKing: number = 0;

  constructor(owner: EPlayer, pieceType: PieceType) {
    this.id = nextId++;
    this.owner = owner;
    this.pieceType = pieceType;
  }

  get lvl(): number {
    return this.pieceType.pieceTypeId.lvl;
  }

  get symbol(): string {
    return this.pieceType.symbol;
  }

  get pos(): Pos {
    return this.position!;
  }

  isPossibleMove(posTo: Pos): boolean {
    for (const pos of this.moveSet.getPossibleMoves()) {
      if (pos.equals(posTo)) return true;
    }
    return false;
  }

  copy(): Piece {
    const copy = new Piece(this.owner, this.pieceType); // PieceType is shared/immutable
    copy.king = this.king;
    copy.position = this.position?.copy() ?? null;
    copy.id = this.id;
    copy.moveSet = new MoveSet();
    for (const pos of this.moveSet.getPossibleMoves()) {
      copy.moveSet.add(pos.copy());
    }
    return copy;
  }
}

export function resetPieceIdCounter(): void {
  nextId = 0;
}
