export interface IPointData {
  x: number;
  y: number;
}

export class Point {
  readonly x: number;
  readonly y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  addition(addend: Point): Point {
    return new Point(this.x + addend.x, this.y + addend.y);
  }

  subtract(term: Point): Point {
    return new Point(this.x - term.x, this.y - term.y);
  }

  divide(divisor: Point): Point {
    return new Point(this.x / divisor.x, this.y / divisor.y);
  }

  multiply(term: Point): Point {
    return new Point(this.x * term.x, this.y * term.y);
  }

  toJSON(): IPointData {
    return { x: this.x, y: this.y };
  }

  static fromJSON(data: any): Point {
    return new Point(data.x, data.y);
  }
}
