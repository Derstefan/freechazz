export enum PosSet {
  pos = 'pos',
  posAround = 'posAround',
  toPos = 'toPos',
  fromPos = 'fromPos',
  toPosAround = 'toPosAround',
  fromPosAround = 'fromPosAround',
}

export function getFieldCount(ps: PosSet): number {
  switch (ps) {
    case PosSet.pos:
    case PosSet.toPos:
    case PosSet.fromPos:
      return 1;
    case PosSet.posAround:
    case PosSet.toPosAround:
    case PosSet.fromPosAround:
      return 8;
  }
}
