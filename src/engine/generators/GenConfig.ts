import { Pos } from '../core/Pos';

export class GenConfig {
  ACTION_WSKS: Map<string, number[]> = new Map();
  POSITION_WSK: Map<string, number> = new Map();
  CIRCLES_WSKS: number[] = [0.01, 0.40, 0.4, 0.1, 0.19];
  MIRROR2_WSK = 0.4;
  MIRROR4_WSK = 0.6;
  MIRROR8_WSK = 0.3;
  MOVE_PATTERN_NUMBER_WSKS: number[] = [0.6, 0.4];
  MOVE_PATTERN_TYPE_WSKS: number[] = [0.3, 0.2666, 0.2666, 0.169, 0.0, 0.0];
  MOVE_PATTERN_LENGTH_WSKS: number[] = [0.0, 0.2, 0.2, 0.2, 0.2, 0.2];
  RUSH_PATTERN_NUMBER_WSKS: number[] = [0.98, 0.02];
  RUSH_PATTERN_TYPE_WSKS: number[] = [0.8, 0.0666, 0.0666, 0.0669, 0.0, 0.0];
  RUSH_PATTERN_LENGTH_WSKS: number[] = [0.0, 0.0, 0.5, 0.5, 0.0, 0.0];

  constructor(lvl: number) {
    // Set default action WSKs
    // Active: normal moves, attacks, swaps
    this.ACTION_WSKS.set('E', [0.0, 0.0, 0.0, 0.0, 0.0]);       // CAPTURE only — disabled
    this.ACTION_WSKS.set('F', [0.0, 0.0, 0.0, 0.0, 0.0]);       // MOVE only — disabled
    this.ACTION_WSKS.set('S', [0.08, 0.08, 0.2, 0.06, 0.04]);   // SWAP
    this.ACTION_WSKS.set('X', [1.0, 1.0, 1.0, 1.0, 1.0]);       // JUMP (rest)
    // Disabled for now (kept in code for later)
    this.ACTION_WSKS.set('L', [0.0, 0.0, 0.0, 0.0, 0.0]);     // LEGION_ATTACK
    this.ACTION_WSKS.set('C', [0.0, 0.0, 0.0, 0.0, 0.0]);     // CROSS_ATTACK
    this.ACTION_WSKS.set('Y', [0.0, 0.0, 0.0, 0.0, 0.0]);     // EXPLOSION
    this.ACTION_WSKS.set('A', [0.0, 0.0, 0.0, 0.0, 0.0]);     // RANGE_ATTACK
    this.ACTION_WSKS.set('Z', [0.0, 0.0, 0.0, 0.0, 0.0]);     // ZOMBIE
    this.ACTION_WSKS.set('Q', [0.0, 0.0, 0.0, 0.0, 0.0]);     // CONVERT
    this.ACTION_WSKS.set('G', [0.0, 0.0, 0.0, 0.0, 0.0]);     // GENERATE (chains)

    this.setLvl(lvl);
  }

  private setLvl(lvl: number): void {
    switch (lvl) {
      case 1:
        this.addPositionWskAtY(2, [0.12, 0.1, 0.06]);
        this.addPositionWskAtY(1, [0.2, 0.2, 0.07]);
        this.addPositionWskAtY(0, [0.0, 0.2, 0.05]);
        this.CIRCLES_WSKS = [0.01, 0.25, 0.64, 0.1];
        this.MIRROR2_WSK = 0.6;
        this.MIRROR4_WSK = 0.3;
        this.MIRROR8_WSK = 0.2;
        break;

      case 2:
        this.addPositionWskAtY(2, [0.15, 0.09, 0.07]);
        this.addPositionWskAtY(1, [0.15, 0.15, 0.09]);
        this.addPositionWskAtY(0, [0.0, 0.15, 0.15]);
        this.CIRCLES_WSKS = [0.0, 0.0, 0.5, 0.4, 0.1];
        this.MIRROR2_WSK = 0.4;
        this.MIRROR4_WSK = 0.6;
        this.MIRROR8_WSK = 0.3;
        break;

      case 3:
        this.addPositionWskAtY(3, [0.066, 0.066, 0.066, 0.066]);
        this.addPositionWskAtY(2, [0.066, 0.066, 0.066, 0.066]);
        this.addPositionWskAtY(1, [0.066, 0.066, 0.066, 0.066]);
        this.addPositionWskAtY(0, [0.0, 0.066, 0.066, 0.066]);
        this.CIRCLES_WSKS = [0.0, 0.0, 0.8, 0.2];
        this.MIRROR2_WSK = 0.4;
        this.MIRROR4_WSK = 0.6;
        this.MIRROR8_WSK = 0.3;
        break;

      case 4:
        this.addPositionWskAtY(3, [0.066, 0.066, 0.066, 0.066]);
        this.addPositionWskAtY(2, [0.066, 0.066, 0.066, 0.066]);
        this.addPositionWskAtY(1, [0.066, 0.066, 0.066, 0.066]);
        this.addPositionWskAtY(0, [0.0, 0.066, 0.066, 0.066]);
        this.CIRCLES_WSKS = [0.0, 0.0, 0.0, 0.7, 0.3];
        this.MIRROR2_WSK = 0.4;
        this.MIRROR4_WSK = 0.6;
        this.MIRROR8_WSK = 0.3;
        this.MOVE_PATTERN_NUMBER_WSKS = [0.2, 0.4, 0.4];
        this.MOVE_PATTERN_TYPE_WSKS = [0.3, 0.2, 0.2, 0.1, 0.1, 0.1];
        this.RUSH_PATTERN_NUMBER_WSKS = [0.7, 0.2, 0.1];
        this.RUSH_PATTERN_LENGTH_WSKS = [0.0, 0.0, 0.4, 0.3, 0.3, 0.0];
        // fall through (matches Java's missing break)
      // eslint-disable-next-line no-fallthrough
      case 5:
        this.addPositionWskAtY(4, [0.04, 0.04, 0.04, 0.04, 0.04]);
        this.addPositionWskAtY(3, [0.04, 0.04, 0.04, 0.04, 0.04]);
        this.addPositionWskAtY(2, [0.04, 0.04, 0.05, 0.04, 0.04]);
        this.addPositionWskAtY(1, [0.05, 0.05, 0.04, 0.04, 0.04]);
        this.addPositionWskAtY(0, [0.0, 0.05, 0.04, 0.04, 0.04]);
        this.CIRCLES_WSKS = [0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.6, 0.2];
        this.MIRROR2_WSK = 0.4;
        this.MIRROR4_WSK = 0.6;
        this.MIRROR8_WSK = 0.3;
        this.MOVE_PATTERN_NUMBER_WSKS = [0.2, 0.3, 0.3, 0.2];
        this.MOVE_PATTERN_TYPE_WSKS = [0.0, 0.0, 0.3, 0.3, 0.2, 0.2];
        this.RUSH_PATTERN_NUMBER_WSKS = [0.5, 0.3, 0.2];
        this.RUSH_PATTERN_LENGTH_WSKS = [0.0, 0.0, 0.3, 0.3, 0.2, 0.2];
        break;

      default:
        this.addPositionWskAtY(4, [0.04, 0.04, 0.04, 0.04, 0.04]);
        this.addPositionWskAtY(3, [0.04, 0.04, 0.04, 0.04, 0.04]);
        this.addPositionWskAtY(2, [0.04, 0.04, 0.05, 0.04, 0.04]);
        this.addPositionWskAtY(1, [0.05, 0.05, 0.04, 0.04, 0.04]);
        this.addPositionWskAtY(0, [0.0, 0.05, 0.04, 0.04, 0.04]);
        this.CIRCLES_WSKS = [0.05, 0.50, 0.2, 0.1, 0.15];
        this.MIRROR2_WSK = 0.4;
        this.MIRROR4_WSK = 0.6;
        this.MIRROR8_WSK = 0.3;
        break;
    }
  }

  private addPositionWskAtY(y: number, wsks: number[]): void {
    for (let i = 0; i < wsks.length; i++) {
      const pos = new Pos(i, y);
      this.POSITION_WSK.set(pos.key, wsks[i]);
    }
  }

  getPositionWsk(pos: Pos): number {
    return this.POSITION_WSK.get(pos.key) ?? 0;
  }
}
