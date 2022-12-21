import crypto from 'node:crypto';
import { render, screen } from 'testUtils';
import userEvent from '@testing-library/user-event';
import { Model, Entity, defaultModel } from '@alephdata/followthemoney';
import TimelineItemCreateForm from './TimelineItemCreateForm';

const model = new Model(defaultModel);

const selectSchema = async (name: string) => {
  await userEvent.click(screen.getByRole('button', { name: 'Type' }));
  await userEvent.click(screen.getByRole('menuitem', { name }));
};

beforeEach(() => {
  // FTM uses crypto.getRandomValues to generate entity IDs.
  // JSDOM doesn't support this API out of the box.
  // TODO: Reenable type checking once we have updated @types/node.
  // @ts-ignore
  global.crypto = crypto.webcrypto;
});

it('selects `Event` schema by default', () => {
  render(<TimelineItemCreateForm model={model} onSubmit={() => {}} />);
  expect(screen.getByRole('button', { name: 'Type' })).toHaveTextContent(
    'Event'
  );
});

it('renders source and target fields for edge schemata', async () => {
  render(<TimelineItemCreateForm model={model} onSubmit={() => {}} />);
  await selectSchema('Ownership');
  expect(screen.getByRole('button', { name: 'Owner' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Asset' })).toBeInTheDocument();
});

it('loads entity suggestions for source and target fields', async () => {
  const company = model.getEntity({
    id: '123',
    schema: 'Company',
    properties: {
      name: ['ACME, Inc.'],
    },
  });

  const fetchEntitySuggestions = jest.fn(async () => [company]);

  render(
    <TimelineItemCreateForm
      model={model}
      onSubmit={() => {}}
      fetchEntitySuggestions={fetchEntitySuggestions}
    />
  );

  await selectSchema('Ownership');
  await userEvent.click(screen.getByRole('button', { name: 'Owner' }));

  const suggestion = await screen.findByRole('menuitem', {
    name: 'ACME, Inc.',
  });
  expect(suggestion).toBeInTheDocument();
});

it('renders caption field for non-edge schemata', async () => {
  render(<TimelineItemCreateForm model={model} onSubmit={() => {}} />);
  await selectSchema('Company');
  expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
});

it('renders temporal extent fields', async () => {
  render(<TimelineItemCreateForm model={model} onSubmit={() => {}} />);

  const startDate = screen.getByRole('textbox', {
    name: 'Start date',
  }) as HTMLInputElement;
  const endDate = screen.getByRole('textbox', {
    name: 'End date',
  }) as HTMLInputElement;
  const date = screen.queryByRole('textbox', { name: 'Date' });

  expect(startDate).toBeInTheDocument();
  expect(startDate.placeholder).toEqual('YYYY-MM-DD');
  expect(endDate).toBeInTheDocument();
  expect(endDate.placeholder).toEqual('YYYY-MM-DD');

  // Fields for `date` and `startDate` properties would be redundant
  expect(date).not.toBeInTheDocument();

  await selectSchema('Court case');

  const fileDate = screen.getByRole('textbox', { name: 'File date' });
  const closeDate = screen.getByRole('textbox', { name: 'Close date' });

  expect(fileDate).toBeInTheDocument();
  expect(closeDate).toBeInTheDocument();
});

it('calls callback with new entity object', async () => {
  const onSubmit = jest.fn();

  render(
    <>
      <TimelineItemCreateForm id="form" model={model} onSubmit={onSubmit} />
      <button type="submit" form="form">
        Submit
      </button>
    </>
  );

  const name = screen.getByRole('textbox', { name: 'Name' });
  const startDate = screen.getByRole('textbox', { name: 'Start date' });
  const submit = screen.getByRole('button', { name: 'Submit' });

  await userEvent.type(name, 'My Event');
  await userEvent.type(startDate, '2022-01-01');
  await userEvent.click(submit);

  expect(onSubmit).toHaveBeenCalledTimes(1);
  const [entity] = onSubmit.mock.calls[0];

  expect(entity.schema.name).toEqual('Event');
  expect(entity).toBeInstanceOf(Entity);
  expect(entity.id).toHaveLength(36);
  expect(entity.getProperty('name')).toEqual(['My Event']);
  expect(entity.getProperty('startDate')).toEqual(['2022-01-01']);
});
