import { render, screen, within } from 'testUtils';
import userEvent from '@testing-library/user-event';
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
