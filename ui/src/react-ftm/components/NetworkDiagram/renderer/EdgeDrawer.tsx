import * as React from 'react';
import { Colors } from '@blueprintjs/core';
import { Point } from 'react-ftm/components/NetworkDiagram/layout';
import {
  getRefMatrix,
  applyMatrix,
} from 'react-ftm/components/NetworkDiagram/renderer/utils';

interface IEdgeDrawerProps {
  svgRef: React.RefObject<SVGSVGElement>;
  sourcePoint?: Point;
}

interface IEdgeDrawerState {
  targetPoint?: Point;
}

export class EdgeDrawer extends React.PureComponent<
  IEdgeDrawerProps,
  IEdgeDrawerState
> {
  constructor(props: Readonly<IEdgeDrawerProps>) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.state = {
      targetPoint: props.sourcePoint,
    };
  }

  componentDidMount() {
    const svg = this.props.svgRef.current;
    if (svg !== null) {
      svg.addEventListener('mousemove', this.onMouseMove);
    }
  }

  componentWillUnmount() {
    const svg = this.props.svgRef.current;
    if (svg !== null) {
      svg.removeEventListener('mousemove', this.onMouseMove);
    }
  }

  onMouseMove(e: MouseEvent) {
    const { svgRef } = this.props;
    const matrix = getRefMatrix(svgRef);
    const targetPoint = applyMatrix(matrix, e.clientX, e.clientY);
    this.setState({ targetPoint });
  }

  render() {
    const { sourcePoint } = this.props;
    const { targetPoint } = this.state;

    if (!sourcePoint || !targetPoint) {
      return null;
    }

    return (
      <g className="edge-drawer">
        <line
          stroke={Colors.GRAY2}
          strokeWidth="1"
          x1={sourcePoint.x}
          y1={sourcePoint.y}
          x2={targetPoint.x}
          y2={targetPoint.y}
        />
      </g>
    );
  }
}
