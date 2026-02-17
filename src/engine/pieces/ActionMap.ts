import type { Action } from '../actions/Action';
import { Pos } from '../core/Pos';

export class ActionMap {
  private actions: Map<string, Action> = new Map();

  put(pos: Pos, action: Action): void {
    this.actions.set(pos.key, action);
  }

  get(pos: Pos): Action | null {
    return this.actions.get(pos.key) ?? null;
  }

  keySet(): Pos[] {
    return Array.from(this.actions.keys()).map(Pos.fromKey);
  }

  getActionSet(): Set<Action> {
    return new Set(this.actions.values());
  }

  getByXY(x: number, y: number): Action | null {
    return this.actions.get(`${x},${y}`) ?? null;
  }

  getAll(): Map<string, Action> {
    return this.actions;
  }

  size(): number {
    return this.actions.size;
  }

  print(): string {
    let s = '';
    for (const [key, action] of this.actions) {
      const pos = Pos.fromKey(key);
      s += ` ${action.symbol}${pos.toString()}`;
    }
    return s;
  }
}
