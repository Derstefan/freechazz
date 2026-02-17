export class Pos {
  constructor(public x: number, public y: number) {}

  add(dx: number, dy: number): Pos {
    return new Pos(this.x + dx, this.y + dy);
  }

  minus(other: Pos): Pos {
    return new Pos(this.x - other.x, this.y - other.y);
  }

  plus(other: Pos): Pos {
    return new Pos(this.x + other.x, this.y + other.y);
  }

  invertY(): Pos {
    return new Pos(this.x, -this.y);
  }

  equals(other: Pos | null): boolean {
    if (!other) return false;
    return this.x === other.x && this.y === other.y;
  }

  getPosAround(): Pos[] {
    return [
      new Pos(this.x - 1, this.y - 1),
      new Pos(this.x, this.y - 1),
      new Pos(this.x + 1, this.y - 1),
      new Pos(this.x - 1, this.y),
      new Pos(this.x + 1, this.y),
      new Pos(this.x - 1, this.y + 1),
      new Pos(this.x, this.y + 1),
      new Pos(this.x + 1, this.y + 1),
    ];
  }

  copy(): Pos {
    return new Pos(this.x, this.y);
  }

  compareTo(other: Pos): number {
    if (this.x < other.x) return -1;
    if (this.x > other.x) return 1;
    if (this.y < other.y) return -1;
    if (this.y > other.y) return 1;
    return 0;
  }

  get key(): string {
    return `${this.x},${this.y}`;
  }

  toString(): string {
    return `(x=${this.x},y=${this.y})`;
  }

  static fromKey(key: string): Pos {
    const [x, y] = key.split(',').map(Number);
    return new Pos(x, y);
  }
}
