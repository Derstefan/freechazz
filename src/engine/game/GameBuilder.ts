import { Game } from './Game';
import type { Formation } from '../formation/Formation';
import { EPlayer, randomPlayer } from '../core/EPlayer';

export class GameBuilder {
  private formation1: Formation;
  private formation2: Formation;
  private firstTurn: EPlayer | null = null;

  constructor(formation1: Formation, formation2: Formation) {
    this.formation1 = formation1;
    this.formation2 = formation2;
  }

  randomStarter(): GameBuilder {
    this.firstTurn = randomPlayer();
    return this;
  }

  firstTurnP1(): GameBuilder {
    this.firstTurn = EPlayer.P1;
    return this;
  }

  firstTurnP2(): GameBuilder {
    this.firstTurn = EPlayer.P2;
    return this;
  }

  firstPlayer(player: EPlayer): GameBuilder {
    this.firstTurn = player;
    return this;
  }

  build(): Game {
    if (!this.firstTurn) {
      throw new Error('First turn is not set');
    }
    const game = new Game(this.formation1, this.formation2);
    game.setPlayersTurn(this.firstTurn);
    game.computePossibleMoves();
    return game;
  }
}
