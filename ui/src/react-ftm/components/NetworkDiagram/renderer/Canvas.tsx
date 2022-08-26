import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Colors } from '@blueprintjs/core';
import { DraggableCore, DraggableEvent, DraggableData } from 'react-draggable';
import { Point } from 'react-ftm/components/NetworkDiagram/layout/Point';
import { Rectangle } from 'react-ftm/components/NetworkDiagram/layout/Rectangle';
import {
  getRefMatrix,
  applyMatrix,
} from 'react-ftm/components/NetworkDiagram/renderer/utils';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { modes } from 'react-ftm/components/NetworkDiagram/utils';

interface ICanvasProps {
  svgRef: React.RefObject<SVGSVGElement>;
  selectArea: (area: Rectangle) => any;
  clearSelection: () => any;
  animateTransition: boolean;
  actions: any;
  viewBox: any;
}

export class Canvas extends React.Component<ICanvasProps> {
  static contextType = GraphContext;
  selectionRef: React.RefObject<SVGRectElement>;
  dragInitial: Point;
  dragExtent: Point;

  constructor(props: Readonly<ICanvasProps>) {
    super(props);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseZoom = this.onMouseZoom.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onResize = this.onResize.bind(this);
    this.selectionRef = React.createRef();
    this.dragInitial = new Point(0, 0);
    this.dragExtent = new Point(0, 0);
  }

  componentDidMount() {
    const { writeable } = this.context;
    const { svgRef } = this.props;

    this.onResize();
    const svg = svgRef.current;
    if (svg !== null) {
      svg.addEventListener('wheel', this.onMouseZoom);
      if (writeable) {
        svg.addEventListener('dblclick', this.onDoubleClick);
      }
      svg.addEventListener('keydown', this.onKeyDown);
      svg.addEventListener('keyup', this.onKeyUp);

      window.addEventListener('resize', this.onResize);
    }
  }

  componentWillUnmount() {
    const { writeable } = this.context;
    const { svgRef } = this.props;

    const svg = svgRef.current;
    if (svg !== null) {
      svg.removeEventListener('wheel', this.onMouseZoom);
      if (writeable) {
        svg.removeEventListener('dblclick', this.onDoubleClick);
      }
      window.removeEventListener('resize', this.onResize);
      svg.removeEventListener('keydown', this.onKeyDown);
      svg.removeEventListener('keyup', this.onKeyUp);
    }
  }

  private onResize() {
    const { updateViewport, viewport } = this.context;
    const svg = this.props.svgRef.current;
    if (svg !== null) {
      const rect = svg.getBoundingClientRect();
      const ratio = rect.height / rect.width;
      updateViewport(viewport.setRatio(ratio));
    }
  }

  private resizeSelection() {
    const selection = this.selectionRef.current;

    if (selection) {
      const rect = Rectangle.fromPoints(this.dragInitial, this.dragExtent);
      selection.setAttribute('x', rect.x + '');
      selection.setAttribute('y', rect.y + '');
      selection.setAttribute('width', rect.width + '');
      selection.setAttribute('height', rect.height + '');
    }
  }

  private onDragMove(e: DraggableEvent, data: DraggableData) {
    const { interactionMode, updateViewport, viewport } = this.context;
    const { svgRef } = this.props;

    const matrix = getRefMatrix(svgRef);
    const current = applyMatrix(matrix, data.x, data.y);
    const last = applyMatrix(matrix, data.lastX, data.lastY);
    const offset = current.subtract(last);
    if (interactionMode === modes.SELECT) {
      this.dragExtent = new Point(
        this.dragExtent.x + offset.x,
        this.dragExtent.y + offset.y
      );
      this.resizeSelection();
    } else if (offset.x || offset.y) {
      const gridOffset = viewport.config.pixelToGrid(offset);
      const center = viewport.center.subtract(gridOffset);
      updateViewport(viewport.setCenter(center));
    }
  }

  private onKeyDown(e: any) {
    const key = e.code;

    switch (key) {
      case 'Space':
        this.props.actions.setInteractionMode(modes.PAN);
        return;
    }
  }

  private onKeyUp(e: any) {
    const { actions } = this.props;
    const key = e.code;

    switch (key) {
      case 'Backspace':
        actions.removeSelection();
        return;
      case 'Equal':
        this.onKeyZoom(e, 'in');
        return;
      case 'Minus':
        this.onKeyZoom(e, 'out');
        return;
      case 'Space':
        this.props.actions.setInteractionMode(modes.SELECT);
        return;
    }
  }

  onDragEnd() {
    const { interactionMode, viewport } = this.context;

    if (interactionMode === modes.SELECT) {
      const initial = viewport.config.pixelToGrid(this.dragInitial);
      const extent = viewport.config.pixelToGrid(this.dragExtent);
      const area = Rectangle.fromPoints(initial, extent);
      this.props.selectArea(area);
    }
    this.dragInitial = new Point(0, 0);
    this.dragExtent = new Point(0, 0);
    this.resizeSelection();
  }

  onDragStart(e: DraggableEvent, data: DraggableData) {
    const { interactionMode } = this.context;
    const { clearSelection, actions } = this.props;
    if (interactionMode === modes.EDGE_DRAW) {
      actions.setInteractionMode();
    }

    clearSelection();
    const matrix = getRefMatrix(this.props.svgRef);
    this.dragInitial = applyMatrix(matrix, data.x, data.y);
    this.dragExtent = this.dragInitial;
  }

  private onMouseZoom(event: WheelEvent) {
    event.preventDefault();
    event.stopPropagation();
    const zoomFactor = 1.5;
    const { updateViewport, viewport } = this.context;
    const direction = event.deltaY < 0 ? -zoomFactor : zoomFactor;
    const matrix = getRefMatrix(this.props.svgRef);
    const target = applyMatrix(matrix, event.clientX, event.clientY);
    const gridTarget = viewport.config.pixelToGrid(target);
    const newViewport = viewport.zoomToPoint(gridTarget, direction);
    updateViewport(newViewport, { animate: false });
  }

  private onKeyZoom(event: KeyboardEvent, direction: string) {
    event.preventDefault();
    event.stopPropagation();
    const { updateViewport, viewport } = this.context;
    const zoomFactor = 3;
    const newViewport = viewport.zoomToPoint(
      viewport.center,
      direction === 'in' ? -zoomFactor : zoomFactor
    );
    updateViewport(newViewport, { animate: true });
  }

  private onDoubleClick(event: MouseEvent) {
    const { viewport } = this.context;
    const matrix = getRefMatrix(this.props.svgRef);
    const target = applyMatrix(matrix, event.clientX, event.clientY);
    const gridTarget = viewport.config.pixelToGrid(target);

    this.props.actions.addVertex({ initialPosition: gridTarget });
  }

  componentWillReceiveProps(nextProps: Readonly<ICanvasProps>): void {
    this.animationHandler(
      nextProps.animateTransition,
      this.props.viewBox || '',
      nextProps.viewBox || ''
    );
  }

  animationHandler(
    animateTransition: boolean,
    oldViewBox: string,
    viewBox: string
  ) {
    if (animateTransition && viewBox && oldViewBox && viewBox !== oldViewBox) {
      this._animateTransition(oldViewBox, viewBox);
    } else {
      this.props.svgRef?.current?.setAttribute('viewBox', viewBox);
    }
  }

  _animateTransition(
    oldViewBox: string,
    viewBox: string,
    userDuration?: number
  ) {
    const start = this._now();
    const domNode = ReactDOM.findDOMNode(this) as Element;
    let req: any;

    const oldVb = oldViewBox.split(' ').map((n) => parseInt(n, 10));
    const newVb = viewBox.split(' ').map((n) => parseInt(n, 10));
    let duration: number = userDuration as number;

    // if duration not supplied, calculate based on change of size and center
    if (!userDuration) {
      const wRatio = newVb[2] / oldVb[2];
      const hRatio = newVb[3] / oldVb[3];
      const oldCenterX = oldVb[0] + oldVb[2] / 2;
      const oldCenterY = oldVb[1] + oldVb[3] / 2;
      const newCenterX = newVb[0] + newVb[2] / 2;
      const newCenterY = newVb[1] + newVb[3] / 2;
      const ratio = Math.max(wRatio, 1 / wRatio, hRatio, 1 / hRatio);
      const dist = Math.floor(
        Math.sqrt(
          Math.pow(newCenterX - oldCenterX, 2) +
            Math.pow(newCenterY - oldCenterY, 2)
        )
      );
      duration = 1 - 1 / (ratio + Math.log(dist + 1));
      duration = Math.max(0.2, duration);
    }

    const draw = () => {
      req = requestAnimationFrame(draw);
      const time = this._now() - start;
      const vb = oldVb
        .map((part, i) => {
          return oldVb[i] + (newVb[i] - oldVb[i]) * (time / duration);
        })
        .join(' ');

      domNode && domNode.setAttribute('viewBox', vb);

      if (time > duration) {
        cancelAnimationFrame(req);
      }
    };

    requestAnimationFrame(draw);
  }

  _now() {
    return new Date().getTime() / 1000;
  }

  render() {
    const { interactionMode, viewport } = this.context;
    const { svgRef } = this.props;
    const grid = `M ${viewport.config.gridUnit} 0 L 0 0 0 ${viewport.config.gridUnit}`;
    const style: React.CSSProperties = {
      width: '100%',
      height: '100%',
      cursor: interactionMode === modes.PAN ? 'grab' : 'crosshair',
    };
    return (
      <svg
        viewBox={viewport.viewBox}
        style={style}
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        tabIndex={0}
      >
        <DraggableCore
          handle="#canvas-handle"
          onStart={this.onDragStart}
          onDrag={this.onDragMove}
          onStop={this.onDragEnd}
          enableUserSelectHack={false}
        >
          <g id="zoom">
            <rect
              id="canvas-handle"
              x="-5000"
              y="-5000"
              width="10000"
              height="10000"
              fill="url(#grid)"
            />
            {this.props.children}
            <rect
              id="selection"
              ref={this.selectionRef}
              stroke="black"
              strokeWidth="0.5px"
              strokeDasharray="2"
              fillOpacity="0"
            />
          </g>
        </DraggableCore>
        <defs>
          <pattern
            id="grid"
            width={viewport.config.gridUnit}
            height={viewport.config.gridUnit}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={grid}
              fill="none"
              stroke={Colors.LIGHT_GRAY3}
              strokeWidth="0.5"
            />
          </pattern>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="29"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
            fill={viewport.config.EDGE_COLOR}
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <marker
            id="arrow-unselected"
            viewBox="0 0 10 10"
            refX="29"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
            fill={viewport.config.UNSELECTED_COLOR}
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <filter x="0" y="0" width="1" height="1" id="solid">
            <feFlood floodColor="#ffffff" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>
      </svg>
    );
  }
}
