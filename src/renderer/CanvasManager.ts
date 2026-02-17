export class CanvasManager {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private animationId: number = 0;
  private renderCallbacks: ((dt: number) => void)[] = [];
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.ctx.scale(dpr, dpr);
    }
  }

  get displayWidth(): number {
    return this.canvas.width / (window.devicePixelRatio || 1);
  }

  get displayHeight(): number {
    return this.canvas.height / (window.devicePixelRatio || 1);
  }

  onRender(callback: (dt: number) => void): void {
    this.renderCallbacks.push(callback);
  }

  start(): void {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      // Cap dt to prevent animation jumps after GC pauses or tab unfocus
      const raw = (now - this.lastTime) / 1000;
      const dt = Math.min(raw, 0.05);
      this.lastTime = now;
      this.ctx.save();
      this.ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
      for (const cb of this.renderCallbacks) {
        cb(dt);
      }
      this.ctx.restore();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  destroy(): void {
    this.stop();
    this.renderCallbacks = [];
  }
}
