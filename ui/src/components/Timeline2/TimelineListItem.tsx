import { CSSProperties, FC } from 'react';
import { Entity } from '@alephdata/followthemoney';

import './TimelineListItem.scss';

type Props = {
  entity: Entity;
  color: string;
};

const TimelineListItem: FC<Props> = ({ entity, color }) => {
  const style: CSSProperties = {
    ['--timeline-item-color' as string]: color,
  };

  const startDate =
    [
      ...entity.getProperty('startDate'),
      ...entity.getProperty('date'),
    ].sort()[0] || null;

  const endDate = entity.getProperty('endDate').sort().slice(-1)[0] || null;

  return (
    <div className="TimelineListItem" style={style}>
      <div className="TimelineListItem__date">
        {startDate}
        {endDate && ` to ${endDate}`}
      </div>
      <strong className="TimelineListItem__caption">
        {entity.getCaption()}
      </strong>
    </div>
  );
};

export default TimelineListItem;
