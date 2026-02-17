import type { Pos } from '../../engine/core/Pos';
import type { Animation, PieceSnapshot } from '../AnimationSystem';

function smoothStep(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

const SHATTER_START_POINT = 0.9;

export class MoveAndDestroyAnimation implements Animation {
  duration: number;
  progressTime: number = 0;

  readonly piece: PieceSnapshot;
  readonly targetPiece: PieceSnapshot;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;

  // Current interpolated position of moving piece
  currentX: number;
  currentY: number;

  // Target piece animation state
  targetScale: number = 1;
  targetAlpha: number = 1;
  targetX: number;
  targetY: number;
  shatterStarted: boolean = false;
  particlesSpawned: boolean = false;

  constructor(
    piece: PieceSnapshot,
    fromPos: Pos,
    toPos: Pos,
    targetPiece: PieceSnapshot,
    cellSize: number,
    offsetX: number,
    offsetY: number,
  ) {
    this.piece = piece;
    this.targetPiece = targetPiece;
    this.fromX = offsetX + fromPos.x * cellSize;
    this.fromY = offsetY + fromPos.y * cellSize;
    this.toX = offsetX + toPos.x * cellSize;
    this.toY = offsetY + toPos.y * cellSize;
    this.currentX = this.fromX;
    this.currentY = this.fromY;
    this.targetX = this.toX;
    this.targetY = this.toY;

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

    // Start shatter effect on target at 90% progress
    if (!this.shatterStarted && t > SHATTER_START_POINT) {
      this.shatterStarted = true;
    }

    if (this.shatterStarted) {
      const shatterProgress = Math.min((t - SHATTER_START_POINT) / (1 - SHATTER_START_POINT), 1);
      this.targetScale = 1 - shatterProgress;
      this.targetAlpha = 1 - shatterProgress;
    }
  }

  isFinished(): boolean {
    return this.progressTime >= this.duration;
  }
}
