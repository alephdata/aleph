import { CSSProperties, FC } from 'react';
import { Entity } from '@alephdata/followthemoney';
import TimelineItemCaption from './TimelineItemCaption';

import './TimelineListItem.scss';

type Props = {
  entity: Entity;
  color: string;
};

const TimelineListItem: FC<Props> = ({ entity, color }) => {
  const style: CSSProperties = {
    ['--timeline-item-color' as string]: color,
  };

  const start = entity.getTemporalStart()?.value;
  const end = entity.getTemporalEnd()?.value;

  return (
    <div className="TimelineListItem" style={style}>
      <div className="TimelineListItem__date">
        {start}
        {end && ` to ${end}`}
      </div>
      <strong className="TimelineListItem__caption">
        <TimelineItemCaption entity={entity} />
      </strong>
    </div>
  );
};

export default TimelineListItem;
