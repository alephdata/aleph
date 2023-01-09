import { render, screen, within } from 'testUtils';
import userEvent from '@testing-library/user-event';
import { Colors } from '@blueprintjs/core';
import { Model, defaultModel } from '@alephdata/followthemoney';
import Timeline from './Timeline';

const model = new Model(defaultModel);

const event1 = model.getEntity({
  id: '1',
  schema: 'Event',
  properties: { name: ['Event 1'], startDate: ['2022-01-01'] },
});

const event2 = model.getEntity({
  id: '2',
  schema: 'Event',
  properties: { name: ['Event 2'], startDate: ['2022-02-01'] },
});

const event3 = model.getEntity({
  id: '3',
  schema: 'Event',
  properties: { name: ['Event 3'], startDate: ['2022-03-01'] },
});

it('sorts and filters items by temporal start', () => {
  const entities = [event3, event1, event2];
  const layout = { vertices: [] };

  render(<Timeline entities={entities} layout={layout} />);
  const items = screen.getAllByRole('listitem');

  expect(items).toHaveLength(3);
  expect(items[0]).toHaveTextContent(/2022-01-01.*Event 1/);
  expect(items[1]).toHaveTextContent(/2022-02-01.*Event 2/);
  expect(items[2]).toHaveTextContent(/2022-03-01.*Event 3/);
});

it('selects item on click', async () => {
  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  render(<Timeline entities={entities} layout={layout} />);
  const items = screen.getAllByRole('listitem');

  await userEvent.click(within(items[0]).getByRole('button'));
  expect(screen.getByRole('heading', { name: 'Event 1' }));

  await userEvent.click(within(items[2]).getByRole('button'));
  expect(screen.getByRole('heading', { name: 'Event 3' }));
});

it('allows changing entity color', async () => {
  const entities = [event1];
  const layout = { vertices: [] };

  render(<Timeline entities={entities} layout={layout} />);
  const item = screen.getByRole('listitem').querySelector('div') as HTMLElement;
  expect(item).toBeInTheDocument();

  await userEvent.click(within(item).getByRole('button', { name: 'Edit' }));

  // TODO: We should refactor the color picker to use semantic markup so we don't have to
  // reference implementation details in tests.
  const swatches = document.querySelectorAll('.ColorPicker__item');
  expect(swatches).toHaveLength(7);

  expect(item.style.getPropertyValue('--timeline-item-color')).toEqual(
    Colors.BLUE2
  );
  await userEvent.click(within(item).getByRole('button', { name: 'Edit' }));
  await userEvent.click(swatches[3]);
  expect(item.style.getPropertyValue('--timeline-item-color')).toEqual(
    Colors.RED2
  );
});

it('allows changing entity properties', async () => {
  const entities = [event1];
  const layout = { vertices: [] };

  render(<Timeline entities={entities} layout={layout} />);
  const item = screen.getByRole('listitem');
  expect(item).toBeInTheDocument();

  await userEvent.click(within(item).getByRole('button', { name: 'Edit' }));

  // TODO: We should refactor the property editor to use semantic markup so we don't have to
  // reference implementation details in tests.
  const properties = document.querySelectorAll('.EditableProperty');
  expect(properties[0]).toBeInTheDocument();
  expect(properties[0]).toHaveTextContent('Name');
  expect(properties[0]).toHaveTextContent('Event 1');

  // Timeline list and entity viewer display entity name
  expect(item).toHaveTextContent('Event 1');
  expect(screen.getByRole('heading', { name: 'Event 1' }));

  // Click the property to toggle editing
  await userEvent.click(properties[0]);

  const input = screen.getByDisplayValue('Event 1');
  await userEvent.clear(input);
  await userEvent.type(input, 'New event name{enter}');

  // Click outside input to toggle editing
  await userEvent.click(document.body);

  // Timeline list and entity viewer dispaly new name
  expect(item).toHaveTextContent('New event name');
  expect(screen.getByRole('heading', { name: 'New event name' }));
});
