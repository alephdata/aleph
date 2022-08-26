import { Rectangle } from 'react-ftm/components/NetworkDiagram/layout';
import { IPositioningProps } from './common';

const getForceData = ({
  vertices,
  edges,
  groupings,
  options = {},
}: IPositioningProps): any => {
  const { center, maintainFixed } = options;

  const layoutCenter =
    center ||
    Rectangle.fromPoints(...vertices.map((v) => v.position)).getCenter();

  const nodes: Array<any> = vertices
    .filter((vertex) => !vertex.isHidden())
    .map((vertex) => {
      const n = {
        id: vertex.id,
        radius: vertex.radius,
        fixed: vertex.fixed,
      } as any;
      if (maintainFixed && vertex.fixed) {
        n.fx = vertex.position.x;
        n.fy = vertex.position.y;
      }
      return n;
    });
  const links: Array<any> = edges
    .map((edge) => {
      return {
        source: nodes.find((n) => n.id === edge.sourceId),
        target: nodes.find((n) => n.id === edge.targetId),
      };
    })
    .filter((link) => link.source && link.target);

  let groupingLinks: Array<any> = [];
  groupings.forEach((grouping) => {
    const gVerts = grouping.getVertexIds();
    gVerts.map((v1) => {
      gVerts.map((v2) => {
        groupingLinks.push({
          source: nodes.find((n) => n.id === v1),
          target: nodes.find((n) => n.id === v2),
        });
      });
    });
  });
  groupingLinks = groupingLinks.filter(
    (link: any) => link.source && link.target && link.source !== link.target
  );

  return { groupingLinks, links, nodes, center: layoutCenter };
};

export default getForceData;
