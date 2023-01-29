import { render, screen } from 'testUtils';
import userEvent from '@testing-library/user-event';
import { Model, defaultModel } from '@alephdata/followthemoney';
import { TimelineItem } from '../util';
import TimelineChart from './TimelineChart';

const model = new Model(defaultModel);

const event1 = model.getEntity({
  id: '1',
  schema: 'Event',
  properties: {
    name: ['Event 1'],
    startDate: ['2022-01-01'],
  },
});

const event2 = model.getEntity({
  id: '2',
  schema: 'Event',
  properties: {
    name: ['Event 2'],
    startDate: ['2022-02-01'],
  },
});

const event3 = model.getEntity({
  id: '3',
  schema: 'Event',
  properties: {
    name: ['Event 3'],
    startDate: ['2022-03-01'],
  },
});

const items = [
  new TimelineItem(event1),
  new TimelineItem(event2),
  new TimelineItem(event3),
];

it('supports navigating the list using arrow keys', async () => {
  render(
    <TimelineChart
      items={items}
      selectedId={null}
      onSelect={() => {}}
      onRemove={() => {}}
      onUnselect={() => {}}
    />
  );

  const listItems = screen.getAllByRole('listitem');

  // Tab to focus first item
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement).toBe(listItems[0]);

  // Arrow up focuses first item (as there is no prev item)
  await userEvent.keyboard('{ArrowUp}');
  expect(document.activeElement).toBe(listItems[0]);

  // Focus next item, twice
  await userEvent.keyboard('{ArrowDown}{ArrowDown}');
  expect(document.activeElement).toBe(listItems[2]);

  // Arrow down focus last item (as there is no next item)
  await userEvent.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(listItems[2]);
});

it('selects and unselects items on click', async () => {
  const entity = model.getEntity({
    schema: 'Event',
    id: '123',
    properties: {
      name: ['Event'],
      date: ['2022'],
    },
  });

  const items = [new TimelineItem(entity)];
  const onSelect = jest.fn();
  const onUnselect = jest.fn();

  render(
    <TimelineChart
      items={items}
      selectedId={null}
      onSelect={onSelect}
      onUnselect={onUnselect}
      onRemove={() => {}}
    />
  );

  const list = screen.getByRole('list');
  const item = screen.getByRole('listitem');

  // Click on a timeline item
  await userEvent.click(item);
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onUnselect).toHaveBeenCalledTimes(0);

  // Click outside of the timeline item, on the empty canvas
  await userEvent.click(list);
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onUnselect).toHaveBeenCalledTimes(1);
});

it('shows popover with details when hovering timeline items', async () => {
  render(
    <TimelineChart
      items={items}
      selectedId={null}
      onSelect={() => {}}
      onRemove={() => {}}
      onUnselect={() => {}}
    />
  );

  const listItems = screen.getAllByRole('listitem');

  await userEvent.hover(listItems[0]);
  expect(document.body).toHaveTextContent(/2022-01-01.*Start date/);

  await userEvent.hover(listItems[1]);
  expect(document.body).not.toHaveTextContent(/2022-01-01.*Start date/);
  expect(document.body).toHaveTextContent(/2022-02-01.*Start date/);
});

it('clicking an items focuses it', async () => {
  render(
    <TimelineChart
      items={items}
      selectedId={null}
      onSelect={() => {}}
      onRemove={() => {}}
      onUnselect={() => {}}
    />
  );

  const listItems = screen.getAllByRole('listitem');

  await userEvent.click(listItems[0]);

  // By default, Blueprint's popovers use a focus trap, i.e. when an element outside of
  // the popover receives focus, Blueprint will try to set focus back to the popover.
  // This is async bevahior, so we need to wait for other items in the "browser's" event
  // queue to be processed before asserting. Otherwise we'd get false negatives.
  await new Promise((resolve) => setTimeout(() => resolve(undefined), 0));

  expect(document.activeElement).toEqual(listItems[0]);

  await userEvent.click(listItems[1]);
  await new Promise((resolve) => setTimeout(() => resolve(undefined), 0));
  expect(document.activeElement).toEqual(listItems[1]);
});
