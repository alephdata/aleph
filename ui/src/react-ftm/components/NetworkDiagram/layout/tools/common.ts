import {
  Edge,
  Grouping,
  Point,
  Vertex,
} from 'react-ftm/components/NetworkDiagram/layout';

export interface IPositioningProps {
  vertices: Array<Vertex>;
  edges: Array<Edge>;
  groupings: Array<Grouping>;
  options?: any;
}

export const getPositionFromSimulation = (nodes: Array<any>) => {
  return (v: Vertex) => {
    const node = nodes.find((n) => n.id === v.id);
    if (node) {
      return new Point(node.x, node.y);
    }
  };
};
