import { Schema, Entity, Value } from '@alephdata/followthemoney';
import { TimelineItem } from './util';

export type TimelineRenderer = 'list' | 'chart';

export type TimelineChartZoomLevel = 'days' | 'months' | 'years';

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
  items: Array<TimelineItem>;
  selectedId: string | null;
  zoomLevel: TimelineChartZoomLevel;
  writeable?: boolean;
  onSelect: (entity: Entity) => void;
  onRemove: (entity: Entity) => void;
  onUnselect: () => void;
};

export type FetchEntitySuggestions = (
  schema: Schema,
  query: string
) => Promise<Array<Entity>>;
