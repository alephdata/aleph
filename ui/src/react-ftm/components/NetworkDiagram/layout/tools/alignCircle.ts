import {
  forceLink,
  forceManyBody,
  forceSimulation,
  forceRadial,
} from 'd3-force';
import { IPositioningProps, getPositionFromSimulation } from './common';
import getForceData from './getForceData';

const alignCircle = (props: IPositioningProps): any => {
  const { center, nodes, groupingLinks } = getForceData(props);
  const radius = props.options?.radius || nodes.length;

  forceSimulation(nodes)
    .force('groupingLinks', forceLink(groupingLinks).strength(1).distance(2))
    .force('charge', forceManyBody())
    .force('radial', forceRadial(radius, center.x, center.y).strength(3))
    .stop()
    .tick(300);

  return { positionVertex: getPositionFromSimulation(nodes) };
};

export default alignCircle;
