import crypto from 'node:crypto';
import { render, screen, within, act, waitFor } from 'testUtils';
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

  render(<Timeline model={model} entities={entities} layout={layout} />);
  const items = screen.getAllByRole('listitem');

  expect(items).toHaveLength(3);
  expect(items[0]).toHaveTextContent(/2022-01-01.*Event 1/);
  expect(items[1]).toHaveTextContent(/2022-02-01.*Event 2/);
  expect(items[2]).toHaveTextContent(/2022-03-01.*Event 3/);
});

it('selects item on click', async () => {
  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  render(<Timeline model={model} entities={entities} layout={layout} />);
  const items = screen
    .getAllByRole('listitem')
    .map((item) => item.querySelector('div') as HTMLElement);

  await userEvent.click(items[0]);
  expect(screen.getByRole('heading', { name: 'Event 1' }));

  await userEvent.click(items[2]);
  expect(screen.getByRole('heading', { name: 'Event 3' }));
});

it('allows changing entity color', async () => {
  const entities = [event1];
  const layout = { vertices: [] };

  render(<Timeline model={model} entities={entities} layout={layout} />);
  const item = screen.getByRole('listitem').querySelector('div') as HTMLElement;
  await userEvent.click(item);

  // TODO: We should refactor the color picker to use semantic markup so we don't have to
  // reference implementation details in tests.
  const swatches = document.querySelectorAll('.ColorPicker__item');
  expect(swatches).toHaveLength(7);

  let color = item.style.getPropertyValue('--timeline-item-color');
  expect(color).toEqual(Colors.BLUE2);

  await userEvent.click(swatches[3]);
  color = item.style.getPropertyValue('--timeline-item-color');
  expect(color).toEqual(Colors.RED2);
});

it('allows changing entity properties', async () => {
  const entities = [event1];
  const layout = { vertices: [] };

  render(<Timeline model={model} entities={entities} layout={layout} />);
  const item = screen.getByRole('listitem').querySelector('div') as HTMLElement;
  await userEvent.click(item);

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

  // Click outside to toggle editing. This needs to be wrapped in `act`,
  // as `PropertyEditor` manually register event handlers to intercept
  // outside clicks.
  await act(async () => userEvent.click(document.body));

  // Timeline list and entity viewer dispaly new name
  expect(item).toHaveTextContent('New event name');
  expect(screen.getByRole('heading', { name: 'New event name' }));
});

it('allow creating new entities', async () => {
  // FTM uses crypto.getRandomValues to generate entity IDs.
  // JSDOM doesn't support this API out of the box.
  // TODO: Reenable type checking once we have updated @types/node.
  // @ts-ignore
  global.crypto = crypto.webcrypto;

  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  render(<Timeline model={model} entities={entities} layout={layout} />);

  await userEvent.click(screen.getByRole('button', { name: 'Add item' }));

  const dialog = screen.getByRole('dialog', { name: /Add new item/ });
  expect(dialog).toBeVisible();

  // 'Event' is the default schema
  expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Start date' }));
  expect(screen.getByRole('textbox', { name: 'End date' }));

  // Change schema to 'Company'
  await userEvent.click(screen.getByRole('button', { name: 'Type' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Company' }));

  // Property inputs adjust based on schema
  const name = screen.getByRole('textbox', { name: 'Name' });
  const incorporation = screen.getByRole('textbox', {
    name: 'Incorporation date',
  });
  const dissolution = screen.getByRole('textbox', { name: 'Dissolution date' });

  expect(name).toBeInTheDocument();
  expect(incorporation).toBeInTheDocument();
  expect(dissolution).toBeInTheDocument();

  await userEvent.type(name, 'ACME, Inc.');
  await userEvent.type(incorporation, '2022-02-15');
  await userEvent.click(screen.getByRole('button', { name: 'Add' }));

  await waitFor(() => expect(dialog).not.toBeVisible());

  // A new item has been added to the list
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(4);
  expect(items[2]).toHaveTextContent('ACME, Inc.');
});

it('allows removing entities', async () => {
  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  render(<Timeline model={model} entities={entities} layout={layout} />);

  let items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(3);

  // Remove second item
  await userEvent.click(
    within(items[1]).getByRole('button', { name: 'Remove' })
  );

  items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(2);
  expect(items[0]).toHaveTextContent('Event 1');
  expect(items[1]).toHaveTextContent('Event 3');
});
