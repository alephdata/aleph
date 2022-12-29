import { render } from 'testUtils';
import { Model, Entity, defaultModel } from '@alephdata/followthemoney';
import { TimelineItem } from '../util';
import { Layout } from '../types';
import TimelineChartItem from './TimelineChartItem';

const model = new Model(defaultModel);
let entity: Entity;
let layout: Layout;

beforeEach(() => {
  entity = model.getEntity({
    schema: 'Event',
    id: '123',
  });

  layout = {
    vertices: [{ entityId: '123', color: 'blue' }],
  };
});

it('sets custom color property', () => {
  entity.setProperty('startDate', '2022');
  const item = new TimelineItem(entity, layout);

  render(
    <TimelineChartItem
      timelineStart={new Date(Date.UTC(2022, 0, 1))}
      item={item}
      onSelect={() => {}}
    />
  );

  const node = document.querySelector('.TimelineChartItem') as HTMLElement;
  const color = node.style.getPropertyValue('--timeline-item-color');
  expect(color).toEqual('blue');
});

it('sets custom start and end properties', () => {
  entity.setProperty('startDate', '2022-01-15');
  entity.setProperty('endDate', '2022-01-20');
  const item = new TimelineItem(entity);

  render(
    <TimelineChartItem
      timelineStart={new Date(Date.UTC(2022, 0, 1))}
      item={item}
      onSelect={() => {}}
    />
  );

  const node = document.querySelector('.TimelineChartItem') as HTMLElement;
  const start = node.style.getPropertyValue('--timeline-chart-item-start-day');
  const end = node.style.getPropertyValue('--timeline-chart-item-end-day');

  expect(start).toEqual('14');
  expect(end).toEqual('20');
});

it('renders entity caption', () => {
  entity.setProperty('name', 'Money laundering workshop');
  const item = new TimelineItem(entity);

  render(
    <TimelineChartItem
      timelineStart={new Date(Date.UTC(2022, 0, 1))}
      item={item}
      onSelect={() => {}}
    />
  );
});
