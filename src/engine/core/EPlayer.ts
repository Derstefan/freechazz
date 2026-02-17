export enum EPlayer {
  P1 = 'P1', // bottom up
  P2 = 'P2', // top down
}

export function getOpponent(player: EPlayer): EPlayer {
  return player === EPlayer.P1 ? EPlayer.P2 : EPlayer.P1;
}

export function randomPlayer(): EPlayer {
  return Math.random() > 0.5 ? EPlayer.P1 : EPlayer.P2;
}
