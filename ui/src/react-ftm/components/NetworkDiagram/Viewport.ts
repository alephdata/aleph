import { Point, Rectangle } from './layout';
import { GraphConfig } from './GraphConfig';

export class Viewport {
  private static readonly BASE_SIZE = 100;
  public readonly config: GraphConfig;
  public center: Point;
  public zoomLevel: number;
  public ratio: number;
  public viewBox?: string;

  constructor(config: GraphConfig, zoomLevel = 0.4, ratio = 1, center?: Point) {
    this.config = config;
    this.zoomLevel = zoomLevel;
    this.ratio = ratio;
    this.center = center || new Point();
    this.computeViewBox();
  }

  zoomedPixelToGrid(point: Point): Point {
    const zoomed = this.config.pixelToGrid(point);
    return new Point(zoomed.x / this.zoomLevel, zoomed.y / this.zoomLevel);
  }

  private computeViewBox() {
    const unit = this.config.gridUnit * this.zoomLevel;
    const widthX = Viewport.BASE_SIZE * unit;
    const widthY = Viewport.BASE_SIZE * unit * this.ratio;
    const minX = this.center.x * this.config.gridUnit - widthX / 2;
    const minY = this.center.y * this.config.gridUnit - widthY / 2;
    this.viewBox = `${minX} ${minY} ${widthX} ${widthY}`;
  }

  clone(): Viewport {
    const clone = Viewport.fromJSON(this.config, this.toJSON());
    clone.viewBox = this.viewBox;
    return clone;
  }

  setRatio(ratio: number): Viewport {
    const viewport = this.clone();
    viewport.ratio = ratio;
    viewport.computeViewBox();
    return viewport;
  }

  setCenter(center: Point): Viewport {
    const viewport = this.clone();
    viewport.center = center;
    viewport.computeViewBox();
    return viewport;
  }

  private getBoundedZoomLevel(zoomLevel: number) {
    return Math.max(0.1, Math.min(3, zoomLevel));
  }

  zoomToPoint(target: Point, direction: number): Viewport {
    const factor = 1 / this.config.gridUnit;
    const zoomChange = direction * factor;
    const zoomLevel = this.zoomLevel * (1 + zoomChange);
    const boundedZoomLevel = this.getBoundedZoomLevel(zoomLevel);
    if (boundedZoomLevel === this.zoomLevel) {
      return this;
    }
    const offset = new Point(
      (target.x - this.center.x) * zoomChange * -1,
      (target.y - this.center.y) * zoomChange * -1
    );
    const center = this.center.addition(offset);
    return this.setZoom(zoomLevel).setCenter(center);
  }

  setZoom(zoomLevel: number): Viewport {
    const viewport = this.clone();
    const boundedZoomLevel = this.getBoundedZoomLevel(zoomLevel);
    if (boundedZoomLevel === viewport.zoomLevel) {
      return this;
    }
    viewport.zoomLevel = boundedZoomLevel;
    viewport.computeViewBox();
    return viewport;
  }

  fitToRect(rect: Rectangle): Viewport {
    const outer = rect.pad(3);
    const zoomX = outer.width / Viewport.BASE_SIZE;
    const zoomY = outer.height / (Viewport.BASE_SIZE * this.ratio);
    const intendedZoom = Math.max(0.4, Math.max(zoomX, zoomY));
    const zoomLevel = this.getBoundedZoomLevel(intendedZoom);
    return this.setZoom(zoomLevel).setCenter(outer.getCenter());
  }

  toJSON(): any {
    // not storing gridUnit, seems to be constant so far. This
    // will probably need review some times.
    return {
      zoomLevel: this.zoomLevel,
      ratio: this.ratio,
      center: this.center.toJSON(),
    };
  }

  static fromJSON(config: GraphConfig, data: any): Viewport {
    const center = Point.fromJSON(data.center);
    return new Viewport(config, data.zoomLevel, data.ratio, center);
  }
}
