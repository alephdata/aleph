import { render, screen, within } from 'testUtils';
import userEvent from '@testing-library/user-event';
import { Model, defaultModel } from '@alephdata/followthemoney';
import { TimelineItem } from '../util';
import TimelineList from './TimelineList';

const model = new Model(defaultModel);

const defaultProps = {
  selectedId: null,
  writeable: true,
  zoomLevel: 'months' as const,
  onSelect: () => {},
  onRemove: () => {},
  onUnselect: () => {},
};

it('supports navigating the list using arrow keys', async () => {
  const event1 = model.getEntity({
    id: '1',
    schema: 'Event',
    properties: {
      startDate: ['2022-01-01'],
    },
  });

  const event2 = model.getEntity({
    id: '2',
    schema: 'Event',
    properties: {
      startDate: ['2022-02-01'],
    },
  });

  const event3 = model.getEntity({
    id: '3',
    schema: 'Event',
    properties: {
      startDate: ['2022-03-01'],
    },
  });

  const items = [
    new TimelineItem(event1),
    new TimelineItem(event2),
    new TimelineItem(event3),
  ];

  render(<TimelineList {...defaultProps} items={items} />);

  const rows = screen.getAllByRole('row');

  // Tab to focus first item
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement).toBe(rows[1]);

  // Tab again to focus "remove" button
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement).toBe(
    within(rows[1]).getByRole('button', { name: 'Remove' })
  );

  // Arrow up focuses first item (as there is no prev item)
  await userEvent.keyboard('{ArrowUp}');
  expect(document.activeElement).toBe(rows[1]);

  // Focus next item, twice
  await userEvent.keyboard('{ArrowDown}{ArrowDown}');
  expect(document.activeElement).toBe(rows[3]);

  // Tab to focus "remove" button
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement).toBe(
    within(rows[3]).getByRole('button', { name: 'Remove' })
  );

  // Arrow down focus last item (as there is no next item)
  await userEvent.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(rows[3]);
});

it('selects items on click', async () => {
  const event1 = model.getEntity({
    schema: 'Event',
    id: '1',
    properties: {
      startDate: ['2022-01'],
    },
  });

  const event2 = model.getEntity({
    schema: 'Event',
    id: '2',
    properties: {
      startDate: ['2022-02'],
    },
  });

  const items = [new TimelineItem(event1), new TimelineItem(event2)];

  const onSelect = jest.fn();

  render(<TimelineList {...defaultProps} onSelect={onSelect} items={items} />);

  const rows = screen.getAllByRole('row');

  await userEvent.click(rows[1]);
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenLastCalledWith(event1);

  await userEvent.click(rows[2]);
  expect(onSelect).toHaveBeenCalledTimes(2);
  expect(onSelect).toHaveBeenLastCalledWith(event2);
});

it('hides end date column if no entity has a temporal end', () => {
  const event = model.getEntity({
    schema: 'Event',
    id: '123',
    properties: {
      startDate: ['2022-01'],
    },
  });

  const items = [new TimelineItem(event)];

  render(<TimelineList {...defaultProps} items={items} />);

  const headers = screen
    .getAllByRole('columnheader')
    .map((header) => header.textContent);

  expect(headers).toEqual(['Date', 'Caption', 'Actions']);
});

it('shows end date column if at least one entity has a temporal end', () => {
  const eventWithoutEnd = model.getEntity({
    schema: 'Event',
    id: '123',
    properties: {
      startDate: ['2022-01'],
    },
  });

  const eventWithEnd = model.getEntity({
    schema: 'Event',
    id: '456',
    properties: {
      startDate: ['2022-04-01'],
      endDate: ['2022-05-01'],
    },
  });

  const items = [
    new TimelineItem(eventWithoutEnd),
    new TimelineItem(eventWithEnd),
  ];

  render(<TimelineList {...defaultProps} items={items} />);

  const headers = screen
    .getAllByRole('columnheader')
    .map((header) => header.textContent);

  expect(headers).toEqual(['Start date', 'End date', 'Caption', 'Actions']);
});

it('shows a warning callout if timeline has items with invalid dates', () => {
  const eventWithoutDate = model.getEntity({
    schema: 'Event',
    id: '0',
  });
  const items = [new TimelineItem(eventWithoutDate)];

  render(<TimelineList {...defaultProps} items={items} />);

  const callout = screen.getByText(
    /This timeline has items with invalid or missing dates./
  );
  expect(callout).toBeInTheDocument();
});
