import { Schema, Entity, Value } from '@alephdata/followthemoney';

export type TimelineEntity = Omit<Entity, 'getTemporalStart'> & {
  getTemporalStart: () => NonNullable<ReturnType<Entity['getTemporalStart']>>;
};

export type Vertex = {
  color?: string;
  entityId: string;
};

export type Layout = {
  vertices: Array<Vertex>;
};

export type EdgeSchema = Schema & {
  edge: NonNullable<Schema['edge']>;
};

export type EntityProperties = {
  [key: string]: Value;
};

export type TimelineRendererProps = {
  entities: Array<Entity>;
  layout: Layout;
  selectedId?: string | null;
  onSelect: (entity: Entity) => void;
  onRemove: (entity: Entity) => void;
};

export type FetchEntitySuggestions = (
  schema: Schema,
  query: string
) => Promise<Array<Entity>>;
