import { CSSProperties, MouseEvent, KeyboardEvent, forwardRef } from 'react';
import { Button, Icon, IconSize } from '@blueprintjs/core';
import c from 'classnames';
import { Entity } from '@alephdata/followthemoney';
import TimelineItemCaption from './TimelineItemCaption';

import './TimelineListItem.scss';

type Props = {
  entity: Entity;
  color: string;
  selected?: boolean;
  muted?: boolean;
  onSelect?: (entity: Entity) => void;
  onRemove?: (entity: Entity) => void;
};

const TimelineListItem = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { entity, color, selected, muted, onSelect, onRemove } = props;

  const style: CSSProperties = {
    ['--timeline-item-color' as string]: color,
  };

  const start = entity.getTemporalStart()?.value;
  const end = entity.getTemporalEnd()?.value;

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
    <div
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
      <div className="TimelineListItem__date">
        {start}
        {end && ` to ${end}`}
      </div>
      <strong className="TimelineListItem__caption">
        <TimelineItemCaption entity={entity} />
      </strong>
      <div className="TimelineListItem__actions">
        <Button minimal small onClick={onEntityRemove}>
          <Icon icon="trash" size={IconSize.STANDARD} />
          <span className="visually-hidden">Remove</span>
        </Button>
      </div>
    </div>
  );
});

export default TimelineListItem;
