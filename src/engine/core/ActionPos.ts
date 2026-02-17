import { Pos } from './Pos';

export class ActionPos extends Pos {
  constructor(x: number, y: number, public tag: string) {
    super(x, y);
  }

  static fromPos(pos: Pos, tag: string): ActionPos {
    return new ActionPos(pos.x, pos.y, tag);
  }

  override copy(): ActionPos {
    return new ActionPos(this.x, this.y, this.tag);
  }
}
