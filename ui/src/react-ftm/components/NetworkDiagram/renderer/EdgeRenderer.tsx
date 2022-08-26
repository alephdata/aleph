import * as React from 'react';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import {
  Edge,
  Vertex,
  Point,
} from 'react-ftm/components/NetworkDiagram/layout';
import { EdgeLabelRenderer } from './EdgeLabelRenderer';
const { Bezier } = require('bezier-js');

interface IEdgeRendererProps {
  edge: Edge;
  vertex1?: Vertex;
  vertex2?: Vertex;
  svgRef: React.RefObject<SVGSVGElement>;
  selectEdge: (edge: Edge, options?: any) => any;
  dragSelection: (offset: Point, initialPosition?: Point) => any;
  dropSelection: () => any;
}

export class EdgeRenderer extends React.PureComponent<IEdgeRendererProps> {
  static contextType = GraphContext;

  constructor(props: Readonly<IEdgeRendererProps>) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e: React.MouseEvent) {
    const { edge, selectEdge } = this.props;
    selectEdge(edge, { additional: e.shiftKey });
    e.preventDefault();
    e.stopPropagation();
  }

  generatePath(vertex1: any, vertex2: any) {
    const { layout } = this.context;
    const { edge } = this.props;

    if (edge.labelPosition) {
      const curveGenerator = Bezier.quadraticFromPoints(
        vertex1,
        layout.config.gridToPixel(edge.labelPosition),
        vertex2,
        0.5
      );
      // location of control point:
      const { x, y } = curveGenerator.points[1];

      return {
        path:
          'M' +
          vertex1.x +
          ' ' +
          vertex1.y +
          ' Q ' +
          x +
          ' ' +
          y +
          ' ' +
          vertex2.x +
          ' ' +
          vertex2.y,
        center: edge.labelPosition,
      };
    } else {
      // mid-point of line:
      const mpx = (vertex2.x + vertex1.x) * 0.5;
      const mpy = (vertex2.y + vertex1.y) * 0.5;

      return {
        path:
          'M' +
          vertex1.x +
          ' ' +
          vertex1.y +
          ' L ' +
          vertex2.x +
          ' ' +
          vertex2.y,
        center: layout.config.pixelToGrid(new Point(mpx, mpy)),
      };
    }
  }

  render() {
    const { layout } = this.context;
    const { edge, vertex1, vertex2, dragSelection, dropSelection, svgRef } =
      this.props;
    if (!vertex1 || !vertex2 || vertex1.hidden || vertex2.hidden) {
      return null;
    }
    const isHighlighted =
      layout.isEdgeHighlighted(edge) || layout.selection.length === 0;
    const isEntity = edge.isEntity();
    const isDirected = edge.directed;

    const vertex1Position = layout.config.gridToPixel(vertex1.position);
    const vertex2Position = layout.config.gridToPixel(vertex2.position);
    const { path, center } = this.generatePath(
      vertex1Position,
      vertex2Position
    );

    const clickableLineStyles: React.CSSProperties = {
      cursor: 'pointer',
    };
    const lineStyles: React.CSSProperties = {
      pointerEvents: 'none',
    };
    const arrowRef = isHighlighted ? 'url(#arrow)' : 'url(#arrow-unselected)';
    return (
      <React.Fragment>
        <g className="edge">
          <path
            stroke="rgba(0,0,0,0)"
            strokeWidth="4"
            fill="none"
            d={path}
            onClick={this.onClick}
            style={clickableLineStyles}
          />
          <path
            stroke={
              isHighlighted
                ? layout.config.EDGE_COLOR
                : layout.config.UNSELECTED_COLOR
            }
            strokeWidth="1"
            fill="none"
            d={path}
            strokeDasharray={isEntity ? '0' : '1'}
            style={lineStyles}
            markerEnd={isDirected ? arrowRef : ''}
          />
        </g>
        {isHighlighted && (
          <EdgeLabelRenderer
            svgRef={svgRef}
            center={center}
            labelText={edge.label}
            onClick={this.onClick}
            dragSelection={dragSelection}
            dropSelection={dropSelection}
            outlineColor={layout.config.EDGE_COLOR}
            textColor={layout.config.EDGE_COLOR}
          />
        )}
      </React.Fragment>
    );
  }
}
