// import {forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation} from "d3-force";
// import {Vertex} from 'NetworkDiagram/Vertex";
// import {Point} from 'NetworkDiagram/Point";
// import {GraphLayout} from 'NetworkDiagram/GraphLayout";
//
// function removeCollisions(layout:GraphLayout): GraphLayout {
//   const nodes = layout.getVertices().filter(v => !v.isHidden())
//     .map(v => {
//       const { position, fixed, label, color, ...rest} = v.toJSON();
//
//       return {
//         x: position.x,
//         y: position.y,
//         ...rest,
//       };
//     });
//
//   const links = layout.getEdges().map((edge) => {
//     return {
//       source: nodes.find((n) => n.id === edge.sourceId),
//       target: nodes.find((n) => n.id === edge.targetId)
//     }
//   }).filter((link) => (link.source && link.target))
//   const simulation = forceSimulation(nodes)
//     .force('collide', forceCollide().radius(n => n.radius).iterations(50))
//     .tick(5)
//     .stop();
//
//   nodes.forEach((node) => {
//     const vertex = layout.vertices.get(node.id) as Vertex
//     const position = new Point(node.x, node.y);
//     layout.vertices.set(vertex.id, vertex.setPosition(position))
//   })
//
//   return layout;
// }
//
// export default removeCollisions;
