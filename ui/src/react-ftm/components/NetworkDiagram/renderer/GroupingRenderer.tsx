import * as React from 'react';
import { DraggableCore, DraggableEvent, DraggableData } from 'react-draggable';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import {
  GraphElement,
  Grouping,
  Point,
  Vertex,
} from 'react-ftm/components/NetworkDiagram/layout';
import {
  getRefMatrix,
  applyMatrix,
} from 'react-ftm/components/NetworkDiagram/renderer/utils';
import { modes } from 'react-ftm/components/NetworkDiagram/utils';

interface IGroupingRendererProps {
  grouping: Grouping;
  vertices: Vertex[];
  selectGrouping: (element: Array<GraphElement>, options?: any) => any;
  dragSelection: (offset: Point) => any;
  dropSelection: () => any;
  actions: any;
}

interface IGroupingRendererState {
  hovered: boolean;
}

export class GroupingRenderer extends React.PureComponent<
  IGroupingRendererProps,
  IGroupingRendererState
> {
  static contextType = GraphContext;
  gRef: React.RefObject<SVGGElement>;

  constructor(props: Readonly<IGroupingRendererProps>) {
    super(props);

    this.state = { hovered: false };
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.gRef = React.createRef();
  }

  private onDragMove(e: DraggableEvent, data: DraggableData) {
    const { layout } = this.context;
    const { actions } = this.props;
    const matrix = getRefMatrix(this.gRef);
    const current = applyMatrix(matrix, data.x, data.y);
    const last = applyMatrix(matrix, data.lastX, data.lastY);
    const offset = layout.config.pixelToGrid(current.subtract(last));
    actions.setInteractionMode(modes.ITEM_DRAG);
    if (offset.x || offset.y) {
      this.props.dragSelection(offset);
    }
  }

  onDragEnd() {
    const { interactionMode } = this.context;
    const { actions, dropSelection } = this.props;
    dropSelection();
    if (interactionMode === modes.ITEM_DRAG) {
      actions.setInteractionMode(modes.SELECT);
    }
  }

  onDragStart(e: DraggableEvent) {
    this.onClick(e);
  }

  onClick(e: any) {
    const { grouping, vertices } = this.props;

    if (grouping.id !== 'selectedArea') {
      this.props.selectGrouping(vertices, { additional: e.shiftKey });
    }
  }

  onMouseOver() {
    this.context.interactionMode === modes.ITEM_DRAG &&
      this.setState({ hovered: true });
  }

  onMouseOut() {
    this.setState({ hovered: false });
  }

  render() {
    const { interactionMode, layout, writeable } = this.context;
    const { grouping, vertices } = this.props;
    const { hovered } = this.state;

    if (!vertices || vertices.length <= 1) {
      return null;
    }

    const { x, y, width, height } = grouping.getBoundingRect();
    const isSelected = layout.isGroupingSelected(grouping);
    const isHighlighted =
      isSelected ||
      layout.isGroupingMemberSelected(grouping) ||
      layout.selection.length === 0;

    const groupStyle: React.CSSProperties = {
      cursor: isSelected && writeable ? 'grab' : 'pointer',
    };
    const textStyle: React.CSSProperties = {
      fontSize: '5px',
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      userSelect: 'none',
    };
    const selectedAreaStyle: React.CSSProperties = {
      stroke: layout.config.UNSELECTED_COLOR,
      strokeWidth: '0.5px',
      strokeDasharray: '2',
      pointerEvents: interactionMode === modes.ITEM_DRAG ? 'none' : 'auto',
    };
    const displayColor =
      grouping && (isHighlighted || hovered)
        ? grouping.color
        : layout.config.UNSELECTED_COLOR;

    return (
      <DraggableCore
        handle=".grouping-handle"
        onStart={this.onDragStart}
        onDrag={writeable ? this.onDragMove : undefined}
        onStop={writeable ? this.onDragEnd : undefined}
        enableUserSelectHack={false}
      >
        <g
          className="grouping-handle"
          style={groupStyle}
          onMouseOver={this.onMouseOver}
          onMouseOut={this.onMouseOut}
          ref={this.gRef}
        >
          <rect
            x={x}
            y={y}
            rx="5"
            width={width}
            height={height}
            fill={displayColor}
            fillOpacity={isHighlighted || hovered ? '.1' : '.2'}
            style={
              grouping.id === 'selectedArea' ? selectedAreaStyle : undefined
            }
          />
          {grouping && (
            <text
              x={x + width / 2}
              y={y + height + 10}
              fill={displayColor}
              textAnchor="middle"
              style={textStyle}
            >
              {grouping.label}
            </text>
          )}
        </g>
      </DraggableCore>
    );
  }
}
