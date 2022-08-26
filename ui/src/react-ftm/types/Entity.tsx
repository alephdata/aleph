import React from 'react';
import { Entity as FTMEntity } from '@alephdata/followthemoney';
import truncateText from 'truncate';
import c from 'classnames';
import Schema from './Schema';
import Transliterate from './Transliterate';

export interface FTMEntityExtended extends FTMEntity {
  latinized?: any;
}

interface IEntityLabelProps {
  entity: FTMEntityExtended;
  icon?: boolean;
  iconSize?: number;
  truncate?: number;
  className?: string;
  transliterate?: boolean;
}

class EntityLabel extends React.Component<IEntityLabelProps> {
  render() {
    const {
      entity,
      icon = false,
      iconSize = 16,
      truncate,
      className,
      transliterate = true,
    } = this.props;
    if (!entity || !entity.id || !FTMEntity.isEntity(entity)) {
      return null;
    }

    const caption = entity.getCaption();
    const label = truncate ? truncateText(caption, truncate) : caption;
    return (
      <span
        className={c('EntityLabel', { 'bp3-text-muted': !label }, className)}
        title={caption}
      >
        {icon && (
          <Schema.Icon
            schema={entity.schema}
            className="left-icon"
            size={iconSize}
          />
        )}
        <span>
          <Transliterate
            value={label}
            lookup={transliterate && entity.latinized}
          />
        </span>
      </span>
    );
  }
}

class Entity extends React.Component {
  static Label = EntityLabel;
}

export default Entity;
