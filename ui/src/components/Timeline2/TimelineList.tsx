import { FC } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { Colors } from '@blueprintjs/colors';
import TimelineListItem from './TimelineListItem';
import { type TimelineProps } from './';

import './TimelineList.scss';

const getColor = (layout: TimelineProps['layout'], entity: Entity): string => {
  return (
    layout.vertices.find((vertex) => vertex.entityId === entity.id)?.color ||
    Colors.BLUE3
  );
};

const TimelineList: FC<TimelineProps> = ({ entities, layout }) => {
  return (
    <ul className="TimelineList">
      {entities.map((entity) => (
        <li key={entity.id}>
          <TimelineListItem entity={entity} color={getColor(layout, entity)} />
        </li>
      ))}
    </ul>
  );
};

export default TimelineList;
