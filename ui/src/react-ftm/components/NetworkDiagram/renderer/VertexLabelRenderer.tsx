import * as React from 'react';
import truncateText from 'truncate';
import { wrapLines } from '../utils';

import { Date, Numeric, URL } from 'react-ftm/types';
import { Point } from 'react-ftm/components/NetworkDiagram/layout/Point';

const labelTruncate = 30;
const fontSize = 5;

interface IVertexLabelRendererProps {
  type: string;
  label: string;
  center: Point;
  onClick?: (e: any) => void;
  color?: string;
  selected?: boolean;
}

export class VertexLabelRenderer extends React.PureComponent<IVertexLabelRendererProps> {
  formatLabel() {
    const { label, type, selected } = this.props;

    if (type === 'url') {
      return (
        <URL
          value={label}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          truncate={labelTruncate}
        />
      );
    }
    if (type === 'date') {
      return <Date value={label} />;
    }
    if (type === 'number') {
      return <Numeric num={Number(label)} />;
    }

    if (selected) {
      return (
        <>
          {wrapLines(label, labelTruncate).map((line, index) => (
            <tspan key={index} x="0" dy={index === 0 ? 0 : fontSize * 1.1}>
              {line}
            </tspan>
          ))}
        </>
      );
    }

    return truncateText(label, labelTruncate);
  }

  render() {
    const { center, onClick, color } = this.props;
    const style = {
      fontSize: `${fontSize}px`,
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      userSelect: 'none',
    } as React.CSSProperties;
    return (
      <text
        x={center.x}
        y={center.y}
        textAnchor="middle"
        alignmentBaseline="middle"
        filter="url(#solid)"
        style={style}
        pointerEvents="none"
        fill={color || 'black'}
        onClick={onClick}
      >
        {this.formatLabel()}
      </text>
    );
  }
}
