import * as React from 'react';
import { Entity, IconRegistry } from '@alephdata/followthemoney';
import { Colors } from '@blueprintjs/core';

interface IIconRendererProps {
  entity: Entity;
  radius: number;
}

export class IconRenderer extends React.PureComponent<IIconRendererProps> {
  render() {
    const { entity, radius } = this.props;

    if (!entity) {
      return null;
    }
    const scaleFactor = radius / 20;
    const translate = `translate(${-12} ${-12})`;
    const scale = `scale(${scaleFactor})`;
    const iconPaths = IconRegistry.getSchemaIcon(entity.schema);
    return (
      iconPaths && (
        <g
          transform={scale + translate}
          fill={Colors.WHITE}
          pointerEvents="none"
        >
          {iconPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )
    );
  }
}
