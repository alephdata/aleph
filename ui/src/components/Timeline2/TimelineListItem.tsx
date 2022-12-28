import { CSSProperties, forwardRef } from 'react';
import { Button, Icon, IconSize } from '@blueprintjs/core';
import c from 'classnames';
import { Entity } from '@alephdata/followthemoney';
import { useTimelineItemKeyboardNavigation } from './util';
import TimelineItemCaption from './TimelineItemCaption';

import './TimelineListItem.scss';

type TimelineListItemProps = {
  entity: Entity;
  color: string;
  selected?: boolean;
  muted?: boolean;
  showEndDate?: boolean;
  onSelect: (entity: Entity) => void;
  onRemove: (entity: Entity) => void;
};

const TimelineListItem = forwardRef<HTMLTableRowElement, TimelineListItemProps>(
  (props, ref) => {
    const {
      entity,
      color,
      selected,
      muted,
      showEndDate = false,
      onSelect,
      onRemove,
    } = props;

    const style: CSSProperties = {
      ['--timeline-item-color' as string]: color,
    };

    const keyboardProps = useTimelineItemKeyboardNavigation(entity, onSelect);

    const start = entity.getTemporalStart();
    const end = entity.getTemporalEnd();

    return (
      <tr
        {...keyboardProps}
        ref={ref}
        tabIndex={0}
        onClick={() => onSelect(entity)}
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
        {showEndDate && (
          <td className="TimelineListItem__date">
            {end?.value}
            <br />
            <span className="TimelineListItem__property">
              {end?.property.label}
            </span>
          </td>
        )}
        <td className="TimelineListItem__caption">
          <strong>
            <TimelineItemCaption entity={entity} />
          </strong>
        </td>
        <td className="TimelineListItem__actions">
          <Button minimal small onClick={() => onRemove(entity)}>
            <Icon icon="trash" size={IconSize.STANDARD} />
            <span className="visually-hidden">Remove</span>
          </Button>
        </td>
      </tr>
    );
  }
);

export default TimelineListItem;
