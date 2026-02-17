import { FreePositionCondition } from './FreePositionCondition';
import { EnemyAtPositionCondition } from './EnemyAtPositionCondition';
import { FriendAtPositionCondition } from './FriendAtPositionCondition';
import { ClearPathCondition } from './ClearPathCondition';
import { IsNoKingCondition } from './IsNoKingCondition';
import { TrivCondition } from '../Condition';

export const FREE_POSITION = new FreePositionCondition();
export const ENEMY_AT_POSITION = new EnemyAtPositionCondition();
export const FRIEND_AT_POSITION = new FriendAtPositionCondition();
export const CLEAR_PATH = new ClearPathCondition();
export const IS_NO_KING = new IsNoKingCondition();
export const ALWAYS = new TrivCondition();
