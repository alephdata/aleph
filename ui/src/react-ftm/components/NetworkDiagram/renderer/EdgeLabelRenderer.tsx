import * as React from 'react';
import { DraggableCore, DraggableEvent, DraggableData } from 'react-draggable';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { Point } from 'react-ftm/components/NetworkDiagram/layout/Point';
import {
  getRefMatrix,
  applyMatrix,
} from 'react-ftm/components/NetworkDiagram/renderer/utils';

import './EdgeLabelRenderer.scss';

interface IEdgeLabelRendererProps {
  labelText: string;
  center: Point;
  onClick: (e: any) => void;
  dragSelection: (offset: Point, initialPosition?: Point) => any;
  dropSelection: () => any;
  outlineColor?: string;
  textColor?: string;
  svgRef: React.RefObject<SVGSVGElement>;
}

interface IEdgeLabelRendererState {
  textExtents: any;
}

export class EdgeLabelRenderer extends React.PureComponent<
  IEdgeLabelRendererProps,
  IEdgeLabelRendererState
> {
  static contextType = GraphContext;
  gRef: React.RefObject<SVGGElement>;
  text: any;
  dragInitial: Point;

  constructor(props: IEdgeLabelRendererProps) {
    super(props);
    this.state = { textExtents: null };
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.gRef = React.createRef();
    this.dragInitial = new Point(0, 0);
  }

  componentDidMount() {
    const { writeable } = this.context;
    const g = this.gRef.current;
    if (writeable && g !== null) {
      g.addEventListener('dblclick', this.onDoubleClick);
    }

    const box = this.text.getBBox();
    this.setState({ textExtents: [box.width, box.height] });
  }

  componentDidUpdate(prevProps: IEdgeLabelRendererProps) {
    if (prevProps.labelText !== this.props.labelText) {
      const box = this.text.getBBox();

      this.setState({ textExtents: [box.width, box.height] });
    }
  }

  componentWillUnmount() {
    const { writeable } = this.context;
    const g = this.gRef.current;
    if (writeable && g !== null) {
      g.removeEventListener('dblclick', this.onDoubleClick);
    }
  }

  private onDragMove(e: DraggableEvent, data: DraggableData) {
    const { config } = this.context.layout;

    const matrix = getRefMatrix(this.gRef);
    const current = applyMatrix(matrix, data.x, data.y);
    const last = applyMatrix(matrix, data.lastX, data.lastY);
    const offset = config.pixelToGrid(current.subtract(last));

    if (offset.x || offset.y) {
      this.props.dragSelection(offset, config.pixelToGrid(this.dragInitial));
    }
  }

  onDragEnd() {
    this.dragInitial = new Point(0, 0);
    this.props.dropSelection();
  }

  onDragStart(e: DraggableEvent, data: DraggableData) {
    const { onClick, svgRef } = this.props;
    const matrix = getRefMatrix(svgRef);
    this.dragInitial = applyMatrix(matrix, data.x, data.y);

    onClick(e);
  }

  onDoubleClick(e: any) {
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    const { layout, writeable } = this.context;
    const { labelText, center, onClick, outlineColor, textColor } = this.props;
    const margin = 1.5;
    const extents = this.state.textExtents;
    const { x, y } = layout.config.gridToPixel(center);
    const translate = `translate(${x} ${y})`;
    const style = {
      fontSize: '5px',
      fontFamily: 'sans-serif',
      userSelect: 'none',
    } as React.CSSProperties;

    const outline = extents ? (
      <rect
        className="EdgeLabel__outline"
        x={-extents[0] / 2 - margin}
        y={-extents[1] / 2 - margin}
        rx={3}
        stroke={outlineColor}
        strokeWidth=".8px"
        fill="white"
        width={extents[0] + 2 * margin}
        height={extents[1] + 2 * margin}
      ></rect>
    ) : null;

    return (
      <DraggableCore
        handle=".edge-handle"
        onStart={writeable ? this.onDragStart : undefined}
        onDrag={writeable ? this.onDragMove : undefined}
        onStop={writeable ? this.onDragEnd : undefined}
        enableUserSelectHack={false}
      >
        <g
          transform={translate}
          onClick={onClick}
          ref={this.gRef}
          className="EdgeLabel"
        >
          <g className="edge-handle">
            {outline}
            <text
              ref={(t) => {
                this.text = t;
              }}
              textAnchor="middle"
              dy={extents ? extents[1] / 4 : 0}
              className="EdgeLabel__text"
              fill={textColor}
              style={style}
              pointerEvents="none"
            >
              {labelText}
            </text>
          </g>
        </g>
      </DraggableCore>
    );
  }
}
