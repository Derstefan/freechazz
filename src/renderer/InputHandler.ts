import { Pos } from '../engine/core/Pos';

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private cellSize: number = 1;
  private onClick: ((pos: Pos) => void) | null = null;
  private onDoubleClick: ((pos: Pos) => void) | null = null;
  private onHover: ((pos: Pos | null) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.handleClick = this.handleClick.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleTouch = this.handleTouch.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    canvas.addEventListener('click', this.handleClick);
    canvas.addEventListener('dblclick', this.handleDoubleClick);
    canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseleave', this.handleMouseLeave);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  setGrid(offsetX: number, offsetY: number, cellSize: number): void {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.cellSize = cellSize;
  }

  setClickHandler(handler: (pos: Pos) => void): void {
    this.onClick = handler;
  }

  setDoubleClickHandler(handler: (pos: Pos) => void): void {
    this.onDoubleClick = handler;
  }

  setHoverHandler(handler: (pos: Pos | null) => void): void {
    this.onHover = handler;
  }

  private pixelToGrid(px: number, py: number): Pos | null {
    const gx = Math.floor((px - this.offsetX) / this.cellSize);
    const gy = Math.floor((py - this.offsetY) / this.cellSize);
    if (gx < 0 || gy < 0) return null;
    return new Pos(gx, gy);
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = this.pixelToGrid(x, y);
    if (pos && this.onClick) this.onClick(pos);
  }

  private handleDoubleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = this.pixelToGrid(x, y);
    if (pos && this.onDoubleClick) this.onDoubleClick(pos);
  }

  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const pos = this.pixelToGrid(x, y);
      if (pos && this.onClick) this.onClick(pos);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = this.pixelToGrid(x, y);
    if (this.onHover) this.onHover(pos);
  }

  private handleMouseLeave(): void {
    if (this.onHover) this.onHover(null);
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
  }

  destroy(): void {
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
    this.canvas.removeEventListener('touchstart', this.handleTouch);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }
}
