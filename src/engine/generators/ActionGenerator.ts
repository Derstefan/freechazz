import { Action } from '../actions/Action';
import { ACTIONS } from '../actions/acts/Actions';
import { ACTS } from '../actions/acts/Acts';
import type { Act } from '../actions/acts/Act';
import type { PosAct } from '../actions/acts/PosAct';
import { PieceAct } from '../actions/acts/PieceAct';
import { ForceActionAct, ForceType } from '../actions/acts/ForceActionAct';
import { DestroyPieceAct } from '../actions/acts/basic/DestroyPieceAct';
import { MoveOrAttackAct } from '../actions/acts/basic/MoveOrAttackAct';
import { RangeAttackAct } from '../actions/acts/basic/RangeAttackAct';
import { RandomActionAct } from '../actions/acts/unitary/RandomActionAct';
import { RandomActionPrefAttackAct } from '../actions/acts/unitary/RandomActionPrefAttackAct';
import { RangedAttackCrossAct } from '../actions/acts/unitary/RangedAttackCrossAct';
import { Connector } from '../actions/connector/Connector';
import { PosSet } from '../actions/connector/PosSet';
import { SeededRandom } from './SeededRandom';

const ACT_CHAIN_TO_POS_PROB = 0.5;

export class ActionGenerator {
  private random: SeededRandom;

  constructor(seed: number) {
    this.random = new SeededRandom(seed);
  }

  generate(depth: number): Action {
    const action = this.getRandomInitialAction();
    this.generateNextStep(action.act, depth);
    action.symbol = `${depth}`;
    return action;
  }

  private generateNextStep(prevAct: Act, depth: number): void {
    if (depth === 0) return;

    const posSet = this.getRandomPosSet(prevAct);
    const nextAct = this.generateUnitaryAct(prevAct, posSet);

    if (prevAct instanceof ForceActionAct && this.random.next() < ACT_CHAIN_TO_POS_PROB) {
      const chainConnector = new Connector();
      chainConnector.addChain(posSet, nextAct);
      prevAct.setChainConnector(chainConnector);
      this.generateNextStep(nextAct, depth - 1);
      return;
    }

    const connector = prevAct.createConnector();
    connector.addChain(posSet, nextAct);
    this.generateNextStep(nextAct, depth - 1);
  }

  private getRandomPosSet(act: Act): PosSet {
    if (act instanceof PieceAct) {
      return this.getRandomBinaryPosSet();
    }
    return this.getRandomUnitaryPosSet();
  }

  private getRandomUnitaryPosSet(): PosSet {
    const sets: [PosSet, number][] = [
      [PosSet.pos, 0.5],
      [PosSet.posAround, 0.5],
    ];
    let val = this.random.next();
    for (const [ps, prob] of sets) {
      val -= prob;
      if (val <= 0) return ps;
    }
    return PosSet.pos;
  }

  private getRandomBinaryPosSet(): PosSet {
    const sets: [PosSet, number][] = [
      [PosSet.toPos, 0.5],
      [PosSet.toPosAround, 0.3],
      [PosSet.fromPos, 0.1],
      [PosSet.fromPosAround, 0.1],
    ];
    let val = this.random.next();
    for (const [ps, prob] of sets) {
      val -= prob;
      if (val <= 0) return ps;
    }
    return PosSet.toPos;
  }

  private generateUnitaryAct(prevAct: Act, posSet: PosSet): PosAct {
    if (prevAct instanceof DestroyPieceAct) {
      if (posSet === PosSet.pos) return this.generateFreePosAct();
    }
    if (prevAct instanceof RangeAttackAct) {
      if (posSet === PosSet.toPos) return this.generateFreePosAct();
      if (posSet === PosSet.fromPos) return this.generateOwnPosAct();
    }
    if (prevAct instanceof MoveOrAttackAct) {
      if (posSet === PosSet.toPos) return this.generateOwnPosAct();
      if (posSet === PosSet.fromPos) return this.generateFreePosAct();
    }

    // Generic pool
    const allActs: [PosAct, number][] = [
      [ACTS.EXPLOSION_ACT.copy(), 1.0],
      [ACTS.DESTROY_PIECE_ACT.copy(), 0.4],
      [new RandomActionAct(ForceType.ENEMY_PIECE), 0.6],
      [new RangedAttackCrossAct(ForceType.OWN_PIECE), 0.5],
      [new RandomActionPrefAttackAct(ForceType.OWN_PIECE), 0.5],
    ];
    let val = this.random.next() * 3.0;
    for (const [act, prob] of allActs) {
      val -= prob;
      if (val <= 0) return act;
    }
    return ACTS.EXPLOSION_ACT.copy();
  }

  private generateFreePosAct(): PosAct {
    return ACTS.EXPLOSION_ACT.copy();
  }

  private generateOwnPosAct(): PosAct {
    const acts: [PosAct, number][] = [
      [new RangedAttackCrossAct(ForceType.OWN_PIECE), 0.5],
      [new RandomActionPrefAttackAct(ForceType.OWN_PIECE), 0.5],
    ];
    let val = this.random.next();
    for (const [act, prob] of acts) {
      val -= prob;
      if (val <= 0) return act;
    }
    return acts[0][0];
  }

  private getRandomInitialAction(): Action {
    const actions: [Action, number][] = [
      [ACTIONS.MOVE_OR_ATTACK_ACTION.copy(), 0.5],
      [ACTIONS.RANGE_ATTACK_ACTION.copy(), 0.5],
    ];
    let val = this.random.next();
    for (const [action, prob] of actions) {
      val -= prob;
      if (val <= 0) return action;
    }
    return actions[0][0];
  }
}
