import { FC, useState } from 'react';
import { Colors } from '@blueprintjs/colors';
import { Entity } from '@alephdata/followthemoney';
import TimelineList from './TimelineList';
import EntityViewer2 from './EntityViewer2';

import './Timeline.scss';

const DEFAULT_COLOR = Colors.BLUE2;

type Vertex = {
  color: string;
  entityId: string;
};

type Layout = {
  vertices: Array<Vertex>;
};

type TimelineProps = {
  entities: Array<Entity>;
  layout: Layout;
};

type TimelineRendererProps = TimelineProps & {
  selectedId?: string | null;
  onSelect: (entity: Entity) => void;
};

type TimelineEntity = Omit<Entity, 'getTemporalStart'> & {
  getTemporalStart: () => NonNullable<ReturnType<Entity['getTemporalStart']>>;
};

const Timeline: FC<TimelineProps> = ({ entities, layout }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEntity = entities.find((entity) => entity.id === selectedId);
  const selectedVertex = layout.vertices.find(
    (vertex) => vertex.entityId === selectedId
  );

  entities = entities
    .filter(
      (entity): entity is TimelineEntity => entity.getTemporalStart() !== null
    )
    .sort((a, b) => {
      const aStart = a.getTemporalStart().value;
      const bStart = b.getTemporalStart().value;

      return aStart.localeCompare(bStart);
    });

  return (
    <div className="Timeline">
      <div className="Timeline__list">
        <TimelineList
          entities={entities}
          layout={layout}
          onSelect={(entity: Entity) => setSelectedId(entity.id)}
          selectedId={selectedId}
        />
      </div>
      {selectedEntity && (
        <div className="Timeline__viewer">
          <EntityViewer2 entity={selectedEntity} vertex={selectedVertex} />
        </div>
      )}
    </div>
  );
};

export default Timeline;
export { DEFAULT_COLOR };
export type { TimelineRendererProps, Vertex };
