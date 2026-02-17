import type { GameOperator } from '../state/GameOperator';

export enum EventType {
  CHANGE_OWNER = 'CHANGE_OWNER',
  CHANGE_TYPE = 'CHANGE_TYPE',
  DESTROY = 'DESTROY',
  MOVE = 'MOVE',
  SWAP = 'SWAP',
  ACT = 'ACT',
  MOVE_AND_DESTROY = 'MOVE_AND_DESTROY',
}

export abstract class Event {
  constructor(public readonly type: EventType) {}

  abstract perform(state: GameOperator): void;
  abstract undo(state: GameOperator): void;
}
