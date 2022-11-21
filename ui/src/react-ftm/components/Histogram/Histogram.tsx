import * as React from 'react';
import { Colors } from '@blueprintjs/core';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import c from 'classnames';
import Numeric from 'react-ftm/types/Numeric';

import './Histogram.scss';

const DEFAULT_FILL = Colors.BLUE2;

const dataFromEvent = (e: any) => e?.activePayload?.[0]?.payload;

interface IHistogramDatum {
  id: string;
  label: string;
  [key: string]: any;
}

interface IHistogramProps extends WrappedComponentProps {
  data: Array<IHistogramDatum>;
  onSelect?: (selected: any | Array<any>) => void;
  chartProps?: any;
  containerProps?: any;
  dataPropName: string;
}

interface IHistogramState {
  selectStart?: IHistogramDatum;
  selectEnd?: IHistogramDatum;
}

export class Histogram extends React.Component<
  IHistogramProps,
  IHistogramState
> {
  constructor(props: Readonly<IHistogramProps>) {
    super(props);

    this.state = {};
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.CustomTooltip = this.CustomTooltip.bind(this);
  }

  onMouseDown(e: any) {
    this.setState({ selectStart: dataFromEvent(e) });
  }

  onMouseMove(e: any) {
    const { selectStart } = this.state;
    selectStart && this.setState({ selectEnd: dataFromEvent(e) });
  }

  onMouseUp(e: any) {
    this.onSelect(e);
  }

  onSelect(e: any) {
    const { selectStart, selectEnd } = this.state;
    const { onSelect } = this.props;

    this.setState({ selectStart: undefined, selectEnd: undefined });

    if (!onSelect) {
      return;
    }

    if (!selectStart || !selectEnd) {
      onSelect(dataFromEvent(e)?.id);
      return;
    }

    onSelect([selectStart.id, selectEnd.id]);
  }

  renderBars() {
    const { data, dataPropName } = this.props;

    return (
      <Bar dataKey={dataPropName}>
        {data.map(({ id, isUncertain }) => (
          <Cell
            fill={isUncertain ? 'url(#diagonalHatch)' : DEFAULT_FILL}
            key={`cell-${id}`}
          />
        ))}
      </Bar>
    );
  }

  CustomTooltip({
    active,
    payload,
    label,
  }: {
    active?: any;
    payload?: any;
    label?: any;
  }) {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formattedLabel = `${data.tooltipLabel || label}${
        data.isUncertain ? '*' : ''
      }`;
      return (
        <div className="Histogram__tooltip">
          <p className="Histogram__tooltip__label">{formattedLabel}</p>
          <ul
            className="Histogram__tooltip__item-list"
            style={{ color: DEFAULT_FILL }}
          >
            <li className="Histogram__tooltip__item">
              {`${this.props.dataPropName}: `}
              <Numeric num={+payload[0].value} />
            </li>
          </ul>
          {data.isUncertain && (
            <p className="Histogram__tooltip__secondary">
              {data.uncertainWarning}
            </p>
          )}
        </div>
      );
    }

    return null;
  }

  render() {
    const { chartProps, containerProps, data } = this.props;
    const { selectStart, selectEnd } = this.state;

    return (
      <div
        className={c('Histogram', {
          dragging: selectStart != null && selectEnd != null,
        })}
      >
        <ResponsiveContainer width="100%" {...containerProps}>
          <BarChart
            data={data}
            barCategoryGap="10%"
            onMouseDown={this.onMouseDown}
            onMouseMove={this.onMouseMove}
            onMouseUp={this.onMouseUp}
            {...chartProps}
          >
            <defs>
              <pattern
                id="diagonalHatch"
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
              >
                <path
                  d="M-1,1 l2,-2
                         M0,4 l4,-4
                         M3,5 l2,-2"
                  style={{ stroke: DEFAULT_FILL, strokeWidth: '1' }}
                />
              </pattern>
            </defs>
            <XAxis dataKey="label" />
            <Tooltip content={<this.CustomTooltip />} />
            {this.renderBars()}
            {selectStart && selectEnd && (
              <ReferenceArea x1={selectStart.label} x2={selectEnd.label} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
}

export default injectIntl(Histogram);
