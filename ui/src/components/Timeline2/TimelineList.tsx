import { FC } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { Colors } from '@blueprintjs/colors';
import TimelineListItem from './TimelineListItem';
import { type TimelineRendererProps } from './Timeline';

import './TimelineList.scss';

const getColor = (
  layout: TimelineRendererProps['layout'],
  entity: Entity
): string => {
  return (
    layout.vertices.find((vertex) => vertex.entityId === entity.id)?.color ||
    Colors.BLUE3
  );
};

const TimelineList: FC<TimelineRendererProps> = ({
  entities,
  layout,
  onSelect,
  selectedId,
}) => {
  return (
    <ul className="TimelineList">
      {entities.map((entity) => (
        <li key={entity.id}>
          <TimelineListItem
            entity={entity}
            muted={!!selectedId && entity.id !== selectedId}
            selected={entity.id === selectedId}
            color={getColor(layout, entity)}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
};

export default TimelineList;
