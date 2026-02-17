import { DestroyPieceAct } from './basic/DestroyPieceAct';
import { MoveAct } from './basic/MoveAct';
import { MoveOrAttackAct } from './basic/MoveOrAttackAct';
import { RangeAttackAct } from './basic/RangeAttackAct';
import { ConvertAct } from './basic/ConvertAct';
import { ExplosionAroundAct } from './unitary/ExplosionAroundAct';
import { TeleportInverseAct } from './unitary/TeleportInverseAct';
import { SwapPositionsAct } from './binary/SwapPositionsAct';
import { RushAct } from './binary/RushAct';
import { CrossAttackAct } from './binary/CrossAttackAct';
import { ExplodeAct } from './binary/ExplodeAct';
import { ZombieAttackAct } from './binary/ZombieAttackAct';
import { LegionAttackAct } from './binary/LegionAttackAct';
import { TeleportPieceAct } from './binary/TeleportPieceAct';

export const ACTS = {
  DESTROY_PIECE_ACT: new DestroyPieceAct(),
  MOVE_ACT: new MoveAct(),
  MOVE_OR_ATTACK: new MoveOrAttackAct(),
  RANGE_ATTACK_ACT: new RangeAttackAct(),
  CONVERT_ACT: new ConvertAct(),
  EXPLOSION_ACT: new ExplosionAroundAct(),
  TELEPORT_INVERSE_ACT: new TeleportInverseAct(),
  SWAP_POSITIONS: new SwapPositionsAct(),
  RUSH_ACT: new RushAct(),
  CROSS_ATTACK_ACT: new CrossAttackAct(),
  EXPLODE_ACT: new ExplodeAct(),
  ZOMBIE_ATTACK_ACT: new ZombieAttackAct(),
  LEGION_ATTACK_ACT: new LegionAttackAct(),
  TELEPORT_PIECE_ACT: new TeleportPieceAct(),
} as const;
