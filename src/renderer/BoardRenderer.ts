const LIGHT_COLOR = '#f0d9b5';
const DARK_COLOR = '#b58863';

const CACHE_LIMIT = 4096;

export class BoardRenderer {
  private boardCanvas: HTMLCanvasElement | null = null;
  private cacheKey = '';

  draw(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    cellSize: number,
    offsetX: number,
    offsetY: number,
    viewW?: number,
    viewH?: number,
  ): void {
    const totalW = cols * cellSize;
    const totalH = rows * cellSize;

    // Large boards: skip cache, render only visible cells directly
    if (totalW > CACHE_LIMIT || totalH > CACHE_LIMIT) {
      const vw = viewW ?? ctx.canvas.width;
      const vh = viewH ?? ctx.canvas.height;
      const startCol = Math.max(0, Math.floor(-offsetX / cellSize));
      const endCol = Math.min(cols, Math.ceil((vw - offsetX) / cellSize));
      const startRow = Math.max(0, Math.floor(-offsetY / cellSize));
      const endRow = Math.min(rows, Math.ceil((vh - offsetY) / cellSize));

      for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? LIGHT_COLOR : DARK_COLOR;
          ctx.fillRect(
            offsetX + x * cellSize,
            offsetY + y * cellSize,
            cellSize,
            cellSize,
          );
        }
      }
      return;
    }

    // Small boards: use cached offscreen canvas
    const key = `${cols}_${rows}_${cellSize}`;

    if (!this.boardCanvas || this.cacheKey !== key) {
      this.boardCanvas = document.createElement('canvas');
      this.boardCanvas.width = Math.ceil(totalW);
      this.boardCanvas.height = Math.ceil(totalH);
      const bctx = this.boardCanvas.getContext('2d')!;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          bctx.fillStyle = (x + y) % 2 === 0 ? LIGHT_COLOR : DARK_COLOR;
          bctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }

      this.cacheKey = key;
    }

    ctx.drawImage(this.boardCanvas, offsetX, offsetY);
  }
}
