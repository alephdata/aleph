import * as dagre from 'dagre';
import { IPositioningProps, getPositionFromSimulation } from './common';
import getForceData from './getForceData';

const arrangeTree = (props: IPositioningProps): any => {
  const { nodes, links } = getForceData(props);

  const g = new dagre.graphlib.Graph({
    multigraph: true,
    directed: true,
  });

  g.setGraph({
    nodesep: 6,
    edgesep: 3,
    ranksep: 9,
    ranker: 'longest-path',
  });

  g.setDefaultEdgeLabel(function () {
    return {};
  });

  nodes.forEach((node: any) => g.setNode(node.id, node));
  links.forEach((link: any) => g.setEdge(link.source.id, link.target.id));

  dagre.layout(g);

  return { positionVertex: getPositionFromSimulation(nodes) };
};

export default arrangeTree;
