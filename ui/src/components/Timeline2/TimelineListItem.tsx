import { CSSProperties, FC, MouseEvent } from 'react';
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
};

const TimelineListItem: FC<Props> = ({
  entity,
  color,
  selected,
  muted,
  onSelect,
}) => {
  const style: CSSProperties = {
    ['--timeline-item-color' as string]: color,
  };

  const start = entity.getTemporalStart()?.value;
  const end = entity.getTemporalEnd()?.value;

  const clickHandler = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onSelect && onSelect(entity);
  };

  return (
    <div
      onClick={clickHandler}
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
      <button className="visually-hidden" onClick={clickHandler}>
        Edit
      </button>
    </div>
  );
};

export default TimelineListItem;
