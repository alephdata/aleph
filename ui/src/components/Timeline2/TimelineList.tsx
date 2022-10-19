import { FC } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { Colors } from '@blueprintjs/colors';
import TimelineListItem from './TimelineListItem';

import './TimelineList.scss';

type Vertex = {
  color: string;
  entityId: string;
};

type Layout = {
  vertices: Array<Vertex>;
};

type Props = {
  entities: Array<Entity>;
  layout: Layout;
};

const getColor = (layout: Layout, entity: Entity): string => {
  return (
    layout.vertices.find((vertex) => vertex.entityId === entity.id)?.color ||
    Colors.BLUE3
  );
};

const TimelineList: FC<Props> = ({ entities, layout }) => {
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
