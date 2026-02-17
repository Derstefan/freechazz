import { ActionPos } from '../core/ActionPos';
import type { Pos } from '../core/Pos';

export class MoveSet {
  private possibleMoves: ActionPos[] = [];

  constructor(moves?: ActionPos[]) {
    if (moves) this.possibleMoves = moves;
  }

  getPossibleMoves(): ActionPos[] {
    return this.possibleMoves;
  }

  size(): number {
    return this.possibleMoves.length;
  }

  getPos(i: number): ActionPos {
    return this.possibleMoves[i];
  }

  getTag(i: number): string {
    return this.possibleMoves[i].tag;
  }

  add(pos: ActionPos): void {
    this.possibleMoves.push(pos);
  }
}
