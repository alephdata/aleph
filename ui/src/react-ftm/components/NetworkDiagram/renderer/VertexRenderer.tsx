import * as React from 'react';
import { Colors } from '@blueprintjs/core';
import { DraggableCore, DraggableEvent, DraggableData } from 'react-draggable';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { Point } from 'react-ftm/components/NetworkDiagram/layout/Point';
import { Vertex } from 'react-ftm/components/NetworkDiagram/layout/Vertex';
import {
  getRefMatrix,
  applyMatrix,
} from 'react-ftm/components/NetworkDiagram/renderer/utils';
import { VertexLabelRenderer } from './VertexLabelRenderer';
import { IconRenderer } from './IconRenderer';
import { modes } from 'react-ftm/components/NetworkDiagram/utils';
import { reduceTranslucentColor } from 'react-ftm/utils/reduceTranslucentColor';

interface IVertexRendererProps {
  vertex: Vertex;
  selectVertex: (vertex: Vertex, options?: any) => any;
  dragSelection: (offset: Point) => any;
  dropSelection: () => any;
  actions: any;
}

interface IVertexRendererState {
  hovered: boolean;
}

// Blueprint 4 comes with an updated color palette that has been
// improved for better accessibility. As a result, the darkest shades
// (e.g. Blue 1) are darker in BP4 compared to BP3. That makes them look
// kinda dull when used in network diagram, so we’re now using the second
// darkest shade (e.g. Blue 2).
//
// This mapping ensures that we render vertices using the new colors,
// even if they have been created when we still used Blueprint 3 colors
// or the darkest shade of the Blueprint 4 colors.

const COLOR_MAPPING: {
  [key: string]: string;
} = {
  // Map Blueprint 3 colors to Blueprint 4 colors
  // Example: BP3 Blue 1 => BP4 Blue 2
  '#0E5A8A': Colors.BLUE2,
  '#A82A2A': Colors.RED2,
  '#0A6640': Colors.GREEN2,
  '#A66321': Colors.ORANGE2,
  '#5C255C': Colors.VIOLET2,
  '#008075': Colors.TURQUOISE2,

  // Map Blueprint 4 colors to lighter shade
  // Example: BP4 Blue 1 => BP Blue 2
  '#184A90': Colors.BLUE2,
  '#8E292C': Colors.RED2,
  '#77450D': Colors.ORANGE2,
  '#165A36': Colors.GREEN2,
  // Violet colors haven’t changed from BP3 to BP4
  '#004D46': Colors.TURQUOISE2,
};

export class VertexRenderer extends React.PureComponent<
  IVertexRendererProps,
  IVertexRendererState
> {
  static contextType = GraphContext;
  context: React.ContextType<typeof GraphContext>;
  gRef: React.RefObject<SVGGElement>;

  constructor(props: Readonly<IVertexRendererProps>) {
    super(props);

    this.state = { hovered: false };
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.gRef = React.createRef();
  }

  componentDidMount() {
    const { writeable } = this.context!;
    const g = this.gRef.current;
    if (writeable && g !== null) {
      g.addEventListener('dblclick', this.onDoubleClick);
    }
  }

  componentWillUnmount() {
    const { writeable } = this.context!;
    const g = this.gRef.current;
    if (writeable && g !== null) {
      g.removeEventListener('dblclick', this.onDoubleClick);
    }
  }

  private onDragMove(e: DraggableEvent, data: DraggableData) {
    const { interactionMode, layout } = this.context!;
    const { actions, dragSelection } = this.props;
    const matrix = getRefMatrix(this.gRef);
    const current = applyMatrix(matrix, data.x, data.y);
    const last = applyMatrix(matrix, data.lastX, data.lastY);
    const offset = layout.config.pixelToGrid(current.subtract(last));
    if (interactionMode !== modes.ITEM_DRAG) {
      actions.setInteractionMode(modes.ITEM_DRAG);
    }

    if (offset.x || offset.y) {
      dragSelection(offset);
    }
  }

  onDragEnd() {
    const { interactionMode } = this.context!;
    const { actions, dropSelection } = this.props;

    if (interactionMode === modes.ITEM_DRAG) {
      actions.setInteractionMode(modes.SELECT);
    }
    dropSelection();
  }

  onDragStart(e: DraggableEvent) {
    this.onClick(e);
  }

  onClick(e: any) {
    const { interactionMode, layout } = this.context!;
    const { vertex, selectVertex, actions } = this.props;
    if (interactionMode === modes.EDGE_DRAW) {
      // can't draw link to self
      if (layout.isElementSelected(vertex)) {
        actions.setInteractionMode(modes.SELECT);
        return;
      } else if (vertex.isEntity()) {
        selectVertex(vertex, { additional: true });
        actions.setInteractionMode(modes.EDGE_CREATE);
        return;
      }
    }
    selectVertex(vertex, { additional: e.shiftKey });
  }

  onDoubleClick(e: MouseEvent) {
    const { entityManager } = this.context!;
    const { actions, vertex } = this.props;
    e.preventDefault();
    e.stopPropagation();
    if (vertex.isEntity()) {
      if (entityManager.hasExpand) {
        actions.showVertexMenu(vertex, new Point(e.clientX, e.clientY));
      } else {
        actions.setInteractionMode(modes.EDGE_DRAW);
      }
    }
  }

  onMouseOver() {
    const { interactionMode } = this.context!;
    const { vertex } = this.props;

    if (interactionMode === modes.EDGE_DRAW && vertex.isEntity()) {
      this.setState({ hovered: true });
    }
  }

  onMouseOut() {
    this.setState({ hovered: false });
  }

  getColor() {
    const { layout } = this.context!;
    const { vertex } = this.props;
    const { hovered } = this.state;

    const highlighted =
      layout.isElementSelected(vertex) || layout.selection.length === 0;

    let color = vertex.color || layout.config.DEFAULT_VERTEX_COLOR;

    if (typeof color === 'string') {
      color = COLOR_MAPPING[color] || color;
    }

    if (highlighted || hovered) {
      return color;
    }

    return reduceTranslucentColor(color, 0.33);
  }

  allowPointerEvents() {
    const { interactionMode } = this.context!;
    const { vertex } = this.props;

    // sets pointer events to none while dragging in order to detect mouseover on other elements
    if (interactionMode === modes.ITEM_DRAG) {
      return false;
    }
    // ensures non-entity vertices can't be selected when drawing edges
    if (interactionMode === modes.EDGE_DRAW && !vertex.isEntity()) {
      return false;
    }
    return true;
  }

  render() {
    const { entityManager, layout, writeable } = this.context!;
    const { vertex } = this.props;
    const { x, y } = layout.config.gridToPixel(vertex.position);
    const selected = layout.isElementSelected(vertex);

    const isEntity = vertex.isEntity();
    const entityId = vertex.entityId;
    const entity = entityId && entityManager.getEntity(vertex.entityId);

    const defaultRadius = isEntity
      ? layout.config.DEFAULT_VERTEX_RADIUS
      : layout.config.DEFAULT_VERTEX_RADIUS / 2;
    const vertexRadius =
      (vertex.radius || defaultRadius) * layout.config.gridUnit;
    const translate = `translate(${x} ${y})`;
    const labelPosition = new Point(
      0,
      vertexRadius + layout.config.gridUnit / 2
    );

    const vertexColor = this.getColor();
    const groupStyles: React.CSSProperties = {
      cursor: selected && writeable ? 'grab' : 'pointer',
      pointerEvents: this.allowPointerEvents() ? 'auto' : 'none',
    };

    return (
      <DraggableCore
        handle=".handle"
        onStart={this.onDragStart}
        onDrag={writeable ? this.onDragMove : undefined}
        onStop={writeable ? this.onDragEnd : undefined}
        enableUserSelectHack={false}
      >
        <g
          className="vertex"
          transform={translate}
          ref={this.gRef}
          style={groupStyles}
        >
          <circle
            className="handle"
            r={vertexRadius}
            fill={isEntity ? vertexColor : 'white'}
            stroke={isEntity ? 'none' : vertexColor}
            onMouseOver={this.onMouseOver}
            onMouseOut={this.onMouseOut}
          />
          <VertexLabelRenderer
            center={labelPosition}
            label={vertex.label}
            type={vertex.type}
            selected={selected}
            onClick={this.onClick}
            color={vertexColor}
          />
          {entity && (
            <IconRenderer
              entity={entity}
              radius={vertexRadius}
            />
          )}
        </g>
      </DraggableCore>
    );
  }
}
