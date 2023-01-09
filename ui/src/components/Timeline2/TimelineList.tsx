import { FC } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { DEFAULT_COLOR } from './Timeline';
import TimelineListItem from './TimelineListItem';
import { type TimelineRendererProps } from './Timeline';

import './TimelineList.scss';

const getColor = (
  layout: TimelineRendererProps['layout'],
  entity: Entity
): string => {
  return (
    layout.vertices.find((vertex) => vertex.entityId === entity.id)?.color ||
    DEFAULT_COLOR
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
