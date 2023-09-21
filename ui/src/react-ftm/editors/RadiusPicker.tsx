import * as React from 'react';
import { Icon, Slider } from '@blueprintjs/core';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { Schema as FTMSchema } from '@alephdata/followthemoney';
import { Schema } from 'react-ftm/types';

import './RadiusPicker.scss';

interface IRadiusPickerProps {
  onChange: (radius: number) => void;
  schema?: FTMSchema;
  radius?: number;
}

class RadiusPicker extends React.PureComponent<IRadiusPickerProps> {
  static contextType = GraphContext;

  render() {
    const { layout } = this.context;
    const { onChange, radius, schema } = this.props;
    const defaultRadius = layout.config.DEFAULT_VERTEX_RADIUS;
    const radiusRange = [defaultRadius * 0.5, defaultRadius * 1.5];
    return (
      <div className="RadiusPicker">
        <div className="RadiusPicker__icon">
          {schema ? (
            <Schema.Icon size={10} schema={schema} />
          ) : (
            <Icon icon="circle" size={10} />
          )}
        </div>
        <Slider
          value={radius || defaultRadius}
          onChange={(value) => onChange(value)}
          min={radiusRange[0]}
          max={radiusRange[1]}
          showTrackFill={false}
          stepSize={0.1}
          labelRenderer={false}
          className="RadiusPicker__slider"
        />
        <div className="RadiusPicker__icon">
          {schema ? (
            <Schema.Icon size={20} schema={schema} />
          ) : (
            <Icon icon="circle" size={20} />
          )}
        </div>
      </div>
    );
  }
}

export default RadiusPicker;
