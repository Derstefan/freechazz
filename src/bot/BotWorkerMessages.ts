import type { EPlayer } from '../engine/core/EPlayer';

export interface BotRequest {
  type: 'compute';
  gameSnapshot: GameSnapshot;
  botPlayer: EPlayer;
  maxDepth: number;
}

export interface BotResponse {
  type: 'result';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface BotSurrender {
  type: 'surrender';
}

export type BotWorkerResponse = BotResponse | BotSurrender;

export interface GameSnapshot {
  formation1Data: FormationData;
  formation2Data: FormationData;
  moves: MoveData[];
  firstTurn: EPlayer;
}

export interface FormationData {
  sizeName: string;
  seed: number;
  samePieces: boolean;
  formationSeed: number;
}

export interface MoveData {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}
