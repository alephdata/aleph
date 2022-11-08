import { CSSProperties, FC, MouseEvent } from 'react';
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

const TimelineListItem: FC<Props> = ({
  entity,
  color,
  selected,
  muted,
  onSelect,
  onRemove,
}) => {
  const style: CSSProperties = {
    ['--timeline-item-color' as string]: color,
  };

  const start = entity.getTemporalStart()?.value;
  const end = entity.getTemporalEnd()?.value;

  const onEntitySelect = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onSelect && onSelect(entity);
  };

  const onEntityRemove = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onRemove && onRemove(entity);
  };

  return (
    <div
      onClick={onEntitySelect}
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
        <div className="visually-hidden">
          <button onClick={onEntitySelect}>Edit</button>
        </div>
        <Button minimal small onClick={onEntityRemove}>
          <Icon icon="trash" size={IconSize.STANDARD} />
          <span className="visually-hidden">Remove</span>
        </Button>
      </div>
    </div>
  );
};

export default TimelineListItem;
