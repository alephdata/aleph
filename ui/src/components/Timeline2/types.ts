import { Schema, Entity, Value } from '@alephdata/followthemoney';
import { TimelineItem } from './util';

export enum TimelineRenderer {
  List = 'list',
  Chart = 'chart',
}

export enum TimelineChartZoomLevel {
  Day = 'day',
  Month = 'month',
  Year = 'year',
}

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
  writeable?: boolean;
  onSelect: (entity: Entity) => void;
  onRemove: (entity: Entity) => void;
  onUnselect: () => void;
};

export type FetchEntitySuggestions = (
  schema: Schema,
  query: string
) => Promise<Array<Entity>>;
