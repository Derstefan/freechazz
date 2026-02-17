import { PieceType } from '../pieces/PieceType';
import { ActionMap } from '../pieces/ActionMap';
import { Pos } from '../core/Pos';
import { Action } from '../actions/Action';
import { ACTIONS } from '../actions/acts/Actions';
import { GenConfig } from './GenConfig';
import { ActionGenerator } from './ActionGenerator';
import { EWalkType } from './EWalkType';
import { SeededRandom } from './SeededRandom';
import { dice } from './GeneratorHelper';

export const GENERATOR_VERSION = 'V1';

export class DefaultPieceTypeGenerator {
  private gc!: GenConfig;
  private rand!: SeededRandom;
  private lvl!: number;

  generate(lvl: number, seed: number): PieceType {
    this.rand = new SeededRandom(seed);
    this.gc = new GenConfig(lvl);
    this.lvl = lvl;

    const map = this.generateActions();
    const piece = PieceType.getInstance(lvl, seed, GENERATOR_VERSION);
    piece.actionMap = map;
    return piece;
  }

  private generateActions(): ActionMap {
    const actions = new ActionMap();
    this.generateJumpActions(actions);
    this.generateWalkActions(actions);
    this.generateRushActions(actions);
    return actions;
  }

  private diceWsks(wsks: number[]): number {
    return dice(wsks, this.rand);
  }

  private dicePosition(): Pos {
    // Sort position keys for determinism
    const keys = Array.from(this.gc.POSITION_WSK.keys()).sort((a, b) => {
      const pa = Pos.fromKey(a);
      const pb = Pos.fromKey(b);
      return pa.compareTo(pb);
    });

    let wsk = this.rand.next();
    for (const key of keys) {
      const prob = this.gc.POSITION_WSK.get(key)!;
      if (wsk <= prob) return Pos.fromKey(key);
      wsk -= prob;
    }
    return new Pos(0, 0);
  }

  // --- Jump Actions ---

  private generateJumpActions(map: ActionMap): void {
    const circleNumber = this.diceWsks(this.gc.CIRCLES_WSKS);
    for (let i = 0; i < circleNumber; i++) {
      const p = this.dicePosition();
      const x = p.x;
      const y = p.y;
      const type = this.generateActionType();

      if (!(x === 0 && y === 0)) {
        // Jump/Rush only make sense at distance > 1; use Move (M) for adjacent cells
        const chebyshev = Math.max(Math.abs(x), Math.abs(y));
        const finalType = (chebyshev <= 1 && (type.symbol === 'X' || type.symbol === 'R'))
          ? ACTIONS.WALK_AND_MOVE_OR_ATTACK
          : type;

        const mirrorWsk = this.rand.next();
        if (mirrorWsk <= this.gc.MIRROR2_WSK) {
          this.addToMap(map, this.getMirrors2(new Pos(x, y)), finalType);
        } else if (mirrorWsk - this.gc.MIRROR2_WSK <= this.gc.MIRROR4_WSK) {
          this.addToMap(map, this.getMirrors4(new Pos(x, y)), finalType);
        } else {
          this.addToMap(map, this.getMirrors8(new Pos(x, y)), finalType);
        }
      } else {
        i--; // retry
      }
    }
  }

  private generateActionType(): Action {
    let wsk = this.rand.next();
    const actionSymbols = ['E', 'F', 'L', 'S', 'C', 'Y', 'A', 'Z', 'Q', 'G'];

    for (const sym of actionSymbols) {
      const wsks = this.gc.ACTION_WSKS.get(sym);
      if (!wsks) continue;
      const prob = wsks[this.lvl - 1] ?? 0;
      if (wsk < prob) {
        if (sym === 'G') {
          const ag = new ActionGenerator(this.rand.nextLong());
          return ag.generate(5);
        }
        return this.getActionBySymbol(sym);
      }
      wsk -= prob;
    }
    return ACTIONS.MOVE_OR_ATTACK_ACTION;
  }

  private getActionBySymbol(sym: string): Action {
    const map: Record<string, Action> = {
      'E': ACTIONS.MOVE_TO_ENEMY_POSITION,
      'F': ACTIONS.MOVE_TO_FREE_POSITION,
      'X': ACTIONS.MOVE_OR_ATTACK_ACTION,
      'M': ACTIONS.WALK_AND_MOVE_OR_ATTACK,
      'S': ACTIONS.SWAP_POSITIONS_ACTION,
      'R': ACTIONS.RUSH_ACTION,
      'C': ACTIONS.CROSS_ATTACK_ACTION,
      'Y': ACTIONS.EXPLOSION_ATTACK_ACTION,
      'Z': ACTIONS.ZOMBIE_ATTACK_ACTION,
      'A': ACTIONS.RANGE_ATTACK_ACTION,
      'Q': ACTIONS.CONVERT_ACTION,
      'L': ACTIONS.LEGION_ATTACK_ACTION,
    };
    return map[sym] ?? ACTIONS.MOVE_OR_ATTACK_ACTION;
  }

  private addToMap(map: ActionMap, positions: Pos[], action: Action): void {
    for (const pos of positions) {
      map.put(pos, action);
    }
  }

  private getMirrors8(pos: Pos): Pos[] {
    const x = pos.x, y = pos.y;
    const set = new Set<string>();
    const result: Pos[] = [];
    for (const p of [
      new Pos(x, y), new Pos(-x, y), new Pos(x, -y), new Pos(-x, -y),
      new Pos(y, x), new Pos(y, -x), new Pos(-y, x), new Pos(-y, -x),
    ]) {
      if (!set.has(p.key)) {
        set.add(p.key);
        result.push(p);
      }
    }
    return result;
  }

  private getMirrors4(pos: Pos): Pos[] {
    const x = pos.x, y = pos.y;
    const set = new Set<string>();
    const result: Pos[] = [];
    for (const p of [new Pos(x, y), new Pos(-x, y), new Pos(x, -y), new Pos(-x, -y)]) {
      if (!set.has(p.key)) {
        set.add(p.key);
        result.push(p);
      }
    }
    return result;
  }

  private getMirrors2(pos: Pos): Pos[] {
    const x = pos.x, y = pos.y;
    const set = new Set<string>();
    const result: Pos[] = [];
    for (const p of [new Pos(x, y), new Pos(-x, y)]) {
      if (!set.has(p.key)) {
        set.add(p.key);
        result.push(p);
      }
    }
    return result;
  }

  // --- Walk (Line) Actions ---

  private generateWalkActions(actions: ActionMap): void {
    const number = this.diceWsks(this.gc.MOVE_PATTERN_NUMBER_WSKS);
    for (let i = 0; i < number; i++) {
      const typeIdx = this.diceWsks(this.gc.MOVE_PATTERN_TYPE_WSKS);
      const type = EWalkType[typeIdx];
      const length = this.diceWsks(this.gc.MOVE_PATTERN_LENGTH_WSKS);
      this.createLineActions(actions, type, length, ACTIONS.WALK_AND_MOVE_OR_ATTACK);
    }
  }

  private generateRushActions(actions: ActionMap): void {
    const number = this.diceWsks(this.gc.RUSH_PATTERN_NUMBER_WSKS);
    for (let i = 0; i < number; i++) {
      const typeIdx = this.diceWsks(this.gc.RUSH_PATTERN_TYPE_WSKS);
      const type = EWalkType[typeIdx];
      const length = this.diceWsks(this.gc.RUSH_PATTERN_LENGTH_WSKS);
      this.createLineActions(actions, type, length, ACTIONS.RUSH_ACTION);
    }
  }

  private createLineActions(actions: ActionMap, type: { dPos: Pos[] }, length: number, action: Action): void {
    if (length < 1 || length > 8) return;
    for (const pos of type.dPos) {
      this.createDiagonal(actions, pos.add(pos.x * length, -pos.y * length), action);
    }
  }

  private createDiagonal(actions: ActionMap, pos: Pos, action: Action): void {
    const x = pos.x;
    const y = pos.y;
    if (Math.abs(x) !== Math.abs(y)) {
      if (x === 0 && y === 0) return;
    }

    let walkPos = new Pos(0, 0);
    const maxSteps = Math.max(Math.abs(x), Math.abs(y));
    for (let i = 0; i < maxSteps; i++) {
      const dx = x !== 0 ? x / Math.abs(x) : 0;
      const dy = y !== 0 ? y / Math.abs(y) : 0;
      walkPos = walkPos.add(dx, dy);
      // Rush at distance ≤ 1 is pointless — use Move (M) instead
      const dist = Math.max(Math.abs(walkPos.x), Math.abs(walkPos.y));
      const cellAction = (action.symbol === 'R' && dist <= 1)
        ? ACTIONS.WALK_AND_MOVE_OR_ATTACK
        : action;
      actions.put(walkPos, cellAction);
    }
  }
}

export class PieceTypeGeneratorRouter {
  generate(lvl: number, seed: number, generatorVersion: string = 'V1'): PieceType {
    const gen = new DefaultPieceTypeGenerator();
    return gen.generate(lvl, seed);
  }
}
