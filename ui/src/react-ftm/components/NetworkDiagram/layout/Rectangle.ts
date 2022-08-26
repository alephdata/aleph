import { Point } from './Point';

export class Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  constructor(x: number, y: number, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = Math.max(0, width);
    this.height = Math.max(0, height);
  }

  getCenter(): Point {
    return new Point(this.x + this.width / 2, this.y + this.height / 2);
  }

  contains(point: Point): boolean {
    return (
      this.x <= point.x &&
      this.y <= point.y &&
      this.x + this.width >= point.x &&
      this.y + this.height >= point.y
    );
  }

  pad(padding: number): Rectangle {
    const center = this.getCenter();
    const width = this.width + padding * 2;
    const height = this.height + padding * 2;
    return new Rectangle(
      center.x - width / 2,
      center.y - height / 2,
      width,
      height
    );
  }

  toString(): string {
    return `Rectangle(${this.x} ${this.y} ${this.width} ${this.height})`;
  }

  static fromPoints(...points: Point[]): Rectangle {
    if (points.length) {
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const mx = Math.max(...xs);
      const my = Math.max(...ys);
      const width = Math.abs(x - mx);
      const height = Math.abs(y - my);
      return new Rectangle(x, y, width, height);
    }
    return new Rectangle(0, 0, 0, 0);
  }
}
