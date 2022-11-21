import * as React from 'react';
import { Point } from 'react-ftm/components/NetworkDiagram/layout';

export function getRefMatrix(
  ref: React.RefObject<SVGGraphicsElement>
): DOMMatrix | null {
  if (ref.current) {
    return ref.current.getScreenCTM();
  }
  return null;
}

export function applyMatrix(
  matrix: DOMMatrix | null,
  x: number,
  y: number
): Point {
  if (matrix) {
    return new Point((x - matrix.e) / matrix.a, (y - matrix.f) / matrix.d);
  }
  return new Point(x, y);
}
