import { render, screen } from '@testing-library/react';
import TimelineListItem from './TimelineListItem';
import { Entity, Model, defaultModel } from '@alephdata/followthemoney';

const model = new Model(defaultModel);

let entity: Entity;

beforeEach(() => {
  entity = model.getEntity({
    id: '1',
    schema: 'Event',
  });
});

it('renders start date', () => {
  entity.setProperty('startDate', '2022-01-01');
  entity.setProperty('startDate', '2022-01-02');

  render(<TimelineListItem entity={entity} color="blue" />);
  expect(screen.getByText('2022-01-01')).toBeInTheDocument();
});

it('renders start and end date', () => {
  entity.setProperty('startDate', '2022-01-01');
  entity.setProperty('endDate', '2022-01-31');
  entity.setProperty('endDate', '2022-02-01');

  render(<TimelineListItem entity={entity} color="blue" />);
  expect(screen.getByText('2022-01-01 to 2022-02-01')).toBeInTheDocument();
});

it('renders caption', () => {
  entity.setProperty('name', 'Money laundering workshop');

  render(<TimelineListItem entity={entity} color="blue" />);
  expect(screen.getByText('Money laundering workshop')).toBeInTheDocument();
});

it('sets custom color property', () => {
  render(<TimelineListItem entity={entity} color="#ff0000" />);
  const node = document.querySelector('.TimelineListItem') as HTMLElement;
  const color = node.style.getPropertyValue('--timeline-item-color');
  expect(color).toEqual('#ff0000');
});
