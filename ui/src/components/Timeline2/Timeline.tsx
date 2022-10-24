import { FC, useState } from 'react';
import { Entity } from '@alephdata/followthemoney';
import TimelineList from './TimelineList';

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
    <TimelineList
      entities={entities}
      layout={layout}
      onSelect={(entity: Entity) => setSelectedId(entity.id)}
      selectedId={selectedId}
    />
  );
};

export default Timeline;
export type { TimelineRendererProps };
