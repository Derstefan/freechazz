import type { Pos } from '../../engine/core/Pos';
import type { Animation, PieceSnapshot } from '../AnimationSystem';

function smoothStep(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

export class MoveAnimation implements Animation {
  duration: number;
  progressTime: number = 0;

  readonly piece: PieceSnapshot;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;

  // Current interpolated pixel position
  currentX: number;
  currentY: number;

  constructor(
    piece: PieceSnapshot,
    fromPos: Pos,
    toPos: Pos,
    cellSize: number,
    offsetX: number,
    offsetY: number,
  ) {
    this.piece = piece;
    this.fromX = offsetX + fromPos.x * cellSize;
    this.fromY = offsetY + fromPos.y * cellSize;
    this.toX = offsetX + toPos.x * cellSize;
    this.toY = offsetY + toPos.y * cellSize;
    this.currentX = this.fromX;
    this.currentY = this.fromY;

    const dx = this.toX - this.fromX;
    const dy = this.toY - this.fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.duration = 0.15 + dist * 0.003;
  }

  animate(dt: number): void {
    this.progressTime += dt;
    const progress = Math.min(this.progressTime / this.duration, 1);
    const t = smoothStep(progress);
    this.currentX = this.fromX + (this.toX - this.fromX) * t;
    this.currentY = this.fromY + (this.toY - this.fromY) * t;
  }

  isFinished(): boolean {
    return this.progressTime >= this.duration;
  }
}
