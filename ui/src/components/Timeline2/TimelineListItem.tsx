import { CSSProperties, MouseEvent, KeyboardEvent, forwardRef } from 'react';
import { Button, Icon, IconSize } from '@blueprintjs/core';
import c from 'classnames';
import { Entity } from '@alephdata/followthemoney';
import TimelineItemCaption from './TimelineItemCaption';

import './TimelineListItem.scss';

type TimelineListItemProps = {
  entity: Entity;
  color: string;
  selected?: boolean;
  muted?: boolean;
  onSelect?: (entity: Entity) => void;
  onRemove?: (entity: Entity) => void;
};

const TimelineListItem = forwardRef<HTMLTableRowElement, TimelineListItemProps>(
  (props, ref) => {
    const { entity, color, selected, muted, onSelect, onRemove } = props;

    const style: CSSProperties = {
      ['--timeline-item-color' as string]: color,
    };

    const start = entity.getTemporalStart();
    const end = entity.getTemporalEnd();

    const onEntitySelect = (event: MouseEvent<HTMLElement>) => {
      onSelect && onSelect(entity);
    };

    const onEntityRemove = (event: MouseEvent<HTMLElement>) => {
      onRemove && onRemove(entity);
    };

    const onKeyPress = (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === ' ' || event.key === 'Enter') {
        onSelect && onSelect(entity);
      }
    };

    return (
      <tr
        ref={ref}
        tabIndex={0}
        onClick={onEntitySelect}
        onKeyPress={onKeyPress}
        style={style}
        className={c(
          'TimelineListItem',
          muted && 'TimelineListItem--muted',
          selected && 'TimelineListItem--selected'
        )}
      >
        <td className="TimelineListItem__date">
          {start?.value}
          <br />
          <span className="TimelineListItem__property">
            {start?.property.label}
          </span>
        </td>
        <td className="TimelineListItem__date">
          {end?.value}
          <br />
          <span className="TimelineListItem__property">
            {end?.property.label}
          </span>
        </td>
        <td className="TimelineListItem__caption">
          <strong>
            <TimelineItemCaption entity={entity} />
          </strong>
        </td>
        <td className="TimelineListItem__actions">
          <Button minimal small onClick={onEntityRemove}>
            <Icon icon="trash" size={IconSize.STANDARD} />
            <span className="visually-hidden">Remove</span>
          </Button>
        </td>
      </tr>
    );
  }
);

export default TimelineListItem;
