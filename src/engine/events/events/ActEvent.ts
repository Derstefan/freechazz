import { Event, EventType } from '../Event';
import type { GameOperator } from '../../state/GameOperator';
import type { Pos } from '../../core/Pos';

export class ActEvent extends Event {
  constructor(
    public readonly actName: string,
    public readonly fromPos: Pos,
    public readonly toPos: Pos,
  ) {
    super(EventType.ACT);
  }

  perform(_state: GameOperator): void {
    // no-op: tracking only
  }

  undo(_state: GameOperator): void {
    // no-op: tracking only
  }
}
