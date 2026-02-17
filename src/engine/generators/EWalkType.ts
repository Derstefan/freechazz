import { Pos } from '../core/Pos';

export interface WalkType {
  name: string;
  dPos: Pos[];
}

export const EWalkType: WalkType[] = [
  { name: 'up', dPos: [new Pos(0, -1)] },
  { name: 'updown', dPos: [new Pos(0, -1), new Pos(0, -1)] },
  { name: 'v', dPos: [new Pos(-1, -1), new Pos(1, -1)] },
  { name: 'leftRight', dPos: [new Pos(0, -1), new Pos(0, -1)] },
  { name: 'cross', dPos: [new Pos(-1, -1), new Pos(1, -1), new Pos(1, 1), new Pos(-1, 1)] },
  { name: 'plus', dPos: [new Pos(0, -1), new Pos(1, 0), new Pos(0, 1), new Pos(-1, 0)] },
];
