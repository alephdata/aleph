import type * as React from 'react';
import { Point } from '/src/react-ftm/components/NetworkDiagram/layout/index.ts';

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
