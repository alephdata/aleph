import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import TimelineListItem from './TimelineListItem';
import { Entity, Model, defaultModel } from '@alephdata/followthemoney';

const model = new Model(defaultModel);

let entity: Entity;

const renderRow = (children: ReactNode) => {
  render(
    <table>
      <tbody>{children}</tbody>
    </table>
  );
};

beforeEach(() => {
  entity = model.getEntity({
    id: '1',
    schema: 'Event',
  });
});

it('renders start date', () => {
  entity.setProperty('startDate', '2022-01-01');
  entity.setProperty('startDate', '2022-01-02');

  renderRow(
    <TimelineListItem
      entity={entity}
      color="blue"
      onSelect={() => {}}
      onRemove={() => {}}
    />
  );

  const startCell = screen.getByText('2022-01-01');
  expect(startCell).toHaveTextContent(/2022-01-01\s*Start date/);
});

it('renders start and end date', () => {
  entity.setProperty('startDate', '2022-01-01');
  entity.setProperty('endDate', '2022-01-31');
  entity.setProperty('endDate', '2022-02-01');

  renderRow(
    <TimelineListItem
      entity={entity}
      color="blue"
      showEndDate={true}
      onSelect={() => {}}
      onRemove={() => {}}
    />
  );

  const startCell = screen.getByText('2022-01-01');
  const endCell = screen.getByText('2022-02-01');
  expect(startCell).toHaveTextContent(/2022-01-01\s*Start date/);
  expect(endCell).toHaveTextContent(/2022-02-01\s*End date/);
});

it('renders caption', () => {
  entity.setProperty('name', 'Money laundering workshop');

  renderRow(
    <TimelineListItem
      entity={entity}
      color="blue"
      onSelect={() => {}}
      onRemove={() => {}}
    />
  );

  expect(screen.getByText('Money laundering workshop')).toBeInTheDocument();
});

it('sets custom color property', () => {
  renderRow(
    <TimelineListItem
      entity={entity}
      color="#ff0000"
      onSelect={() => {}}
      onRemove={() => {}}
    />
  );

  const node = document.querySelector('.TimelineListItem') as HTMLElement;
  const color = node.style.getPropertyValue('--timeline-item-color');
  expect(color).toEqual('#ff0000');
});
