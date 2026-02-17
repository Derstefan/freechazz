import type { Act } from '../acts/Act';
import type { PosAct } from '../acts/PosAct';
import { PosSet } from './PosSet';
import type { Pos } from '../../core/Pos';
import type { GameOperator } from '../../state/GameOperator';

export class Connector {
  previousAct: Act | null = null;
  private nextActs: Map<PosSet, Act> = new Map();

  constructor(previousAct?: Act) {
    this.previousAct = previousAct ?? null;
  }

  // perform function for binary acts (fromPos, toPos)
  performBinary(board: GameOperator, fromPos: Pos, toPos: Pos): void {
    for (const [posSet, act] of this.nextActs) {
      const posAct = act as PosAct;
      switch (posSet) {
        case PosSet.fromPos:
          posAct.performWithoutChain(board, fromPos);
          break;
        case PosSet.toPos:
          posAct.performWithoutChain(board, toPos);
          break;
        case PosSet.fromPosAround:
          for (const p of fromPos.getPosAround()) {
            posAct.performWithoutChain(board, p);
          }
          break;
        case PosSet.toPosAround:
          for (const p of toPos.getPosAround()) {
            posAct.performWithoutChain(board, p);
          }
          break;
      }
    }
  }

  // perform function for unitary acts (single pos)
  performUnitary(board: GameOperator, pos: Pos): void {
    for (const [posSet, act] of this.nextActs) {
      const posAct = act as PosAct;
      switch (posSet) {
        case PosSet.pos:
          posAct.performWithoutChain(board, pos);
          break;
        case PosSet.posAround:
          for (const p of pos.getPosAround()) {
            posAct.performWithoutChain(board, p);
          }
          break;
      }
    }
  }

  addChain(posSet: PosSet, act: Act): void {
    this.nextActs.set(posSet, act);
  }

  getNextActs(): Map<PosSet, Act> {
    return this.nextActs;
  }
}
