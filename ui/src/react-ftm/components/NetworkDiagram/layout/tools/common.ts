import {
  type Edge,
  type Grouping,
  Point,
  type Vertex,
} from '/src/react-ftm/components/NetworkDiagram/layout/index.ts';

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
