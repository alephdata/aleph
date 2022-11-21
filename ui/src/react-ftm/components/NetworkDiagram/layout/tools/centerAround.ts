import {
  GraphLayout,
  Rectangle,
  Vertex,
} from 'react-ftm/components/NetworkDiagram/layout';
import alignCircle from './alignCircle';

const RADIUS_SPACING = 8;

const centerAround = (
  layout: GraphLayout,
  vertsToCenter?: Array<Vertex>,
  vertsToPosition?: Array<Vertex>
): any => {
  const toCenter = vertsToCenter || layout.getSelectedVertices();
  const toPosition =
    vertsToPosition ||
    layout
      .getVertices()
      .filter((v) => !v.isHidden() && toCenter.indexOf(v) < 0);
  const adjacentEdges = layout.getAdjacentEdges(toPosition.map((v) => v.id));
  const groupings = layout.getGroupings();

  const centerBBox = Rectangle.fromPoints(...toCenter.map((v) => v.position));
  const radius = Math.max(
    centerBBox.width / 2 + RADIUS_SPACING,
    centerBBox.height / 2 + RADIUS_SPACING,
    toPosition.length
  );

  const positioningFunc = alignCircle({
    vertices: toPosition,
    edges: adjacentEdges,
    groupings,
    options: { center: centerBBox.getCenter(), radius },
  });

  return layout.applyPositioning(positioningFunc, toPosition);
};

export default centerAround;
