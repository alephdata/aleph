import crypto from 'node:crypto';
import { render, screen, within, act, waitFor } from 'testUtils';
import userEvent from '@testing-library/user-event';
import { Colors } from '@blueprintjs/core';
import { Entity, Model, defaultModel } from '@alephdata/followthemoney';
import Timeline from './Timeline';
import TimelineActions from './TimelineActions';
import { TimelineContextProvider } from './context';

const model = new Model(defaultModel);

const defaultProps = {
  model,
  fetchEntitySuggestions: async () => [],
  writeable: true,
  onEntityCreateOrUpdate: async (entity: Entity) => entity,
  onEntityRemove: async () => {},
  onLayoutUpdate: async () => {},
};

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

beforeEach(() => {
  // jsdom doesn't actually calculate layouts or renders anything, so methods that
  // rely on this like `scrollIntoView` are not available and need to be stubbed.
  window.Element.prototype.scrollIntoView = jest.fn();
});

it('sorts and filters items by temporal start', () => {
  const entities = [event3, event1, event2];
  const layout = { vertices: [] };

  render(
    <TimelineContextProvider entities={entities} layout={layout}>
      <Timeline {...defaultProps} />
    </TimelineContextProvider>
  );
  const rows = screen.getAllByRole('row');

  expect(rows).toHaveLength(4); // 3 items + 1 header row
  expect(rows[1]).toHaveTextContent(/2022-01-01.*Event 1/);
  expect(rows[2]).toHaveTextContent(/2022-02-01.*Event 2/);
  expect(rows[3]).toHaveTextContent(/2022-03-01.*Event 3/);
});

describe('Sidebar', () => {
  it('allows changing entity color', async () => {
    const entities = [event1];
    const layout = { vertices: [] };
    const onLayoutUpdate = jest.fn();

    render(
      <TimelineContextProvider entities={entities} layout={layout}>
        <Timeline {...defaultProps} onLayoutUpdate={onLayoutUpdate} />
      </TimelineContextProvider>
    );

    const rows = screen.getAllByRole('row');
    await userEvent.click(rows[1]);

    // TODO: We should refactor the color picker to use semantic markup so we don't have to
    // reference implementation details in tests.
    const swatches = document.querySelectorAll('.ColorPicker__item');
    expect(swatches).toHaveLength(7);

    let color = rows[1].style.getPropertyValue('--timeline-item-color');
    expect(color).toEqual(Colors.BLUE2);

    await userEvent.click(swatches[3]);
    color = rows[1].style.getPropertyValue('--timeline-item-color');
    expect(color).toEqual(Colors.RED2);
    expect(onLayoutUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not allow changing entity color if not writeable', async () => {
    const entities = [event1];
    const layout = { vertices: [] };

    render(
      <TimelineContextProvider entities={entities} layout={layout}>
        <Timeline {...defaultProps} writeable={false} />
      </TimelineContextProvider>
    );

    const rows = screen.getAllByRole('row');
    await userEvent.click(rows[1]);

    expect(document.querySelector('.ColorPicker')).toBeNull();
  });

  it('allows changing entity properties', async () => {
    const entities = [event1];
    const layout = { vertices: [] };

    render(
      <TimelineContextProvider entities={entities} layout={layout}>
        <Timeline {...defaultProps} />
      </TimelineContextProvider>
    );
    const rows = screen.getAllByRole('row');
    await userEvent.click(rows[1]);

    // TODO: We should refactor the property editor to use semantic markup so we don't have to
    // reference implementation details in tests.
    const properties = document.querySelectorAll('.EditableProperty');
    expect(properties[0]).toHaveTextContent('Name');
    expect(properties[0]).toHaveTextContent('Event 1');

    // Timeline list and entity viewer display entity name
    expect(rows[1]).toHaveTextContent('Event 1');
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
    expect(rows[1]).toHaveTextContent('New event name');
    expect(
      screen.getByRole('heading', { name: 'New event name' })
    ).toBeInTheDocument();
  });

  it('does not allow changing entity properties if not writeable', async () => {
    const entities = [event1];
    const layout = { vertices: [] };

    render(
      <TimelineContextProvider entities={entities} layout={layout}>
        <Timeline {...defaultProps} writeable={false} />
      </TimelineContextProvider>
    );

    const rows = screen.getAllByRole('row');
    await userEvent.click(rows[1]);

    const properties = document.querySelectorAll('.EditableProperty');
    expect(properties[0]).toHaveTextContent('Name');
    expect(properties[0]).toHaveTextContent('Event 1');

    // Click the property to try toggle editing
    await userEvent.click(properties[0]);

    // There's no input displayed because we're in read-only mode
    expect(screen.queryByDisplayValue('Event 1')).toBeNull();
  });

  it('allows changing entity-type properties', async () => {
    const layout = { vertices: [] };

    const acmeInc = model.getEntity({
      schema: 'Company',
      id: 'acme-inc',
      properties: {
        name: ['ACME, Inc.'],
      },
    });

    const acmeEurope = model.getEntity({
      schema: 'Company',
      id: 'acme-europe',
      properties: {
        name: ['ACME Europe SE'],
      },
    });

    const johnDoe = model.getEntity({
      schema: 'Person',
      id: 'joh-doe',
      properties: {
        name: ['John Doe'],
      },
    });

    const ownership = model.getEntity({
      schema: 'Directorship',
      id: 'ownership',
      properties: {
        startDate: ['2022-01-01'],
        director: [johnDoe],
        organization: [acmeInc],
      },
    });

    render(
      <TimelineContextProvider entities={[ownership]} layout={layout}>
        <Timeline
          {...defaultProps}
          fetchEntitySuggestions={async () => [acmeInc, acmeEurope]}
        />
      </TimelineContextProvider>
    );

    // Select the ownership entity
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('John Doe directs ACME, Inc.');
    await userEvent.click(rows[1]);

    // The entity viewer is opened
    const properties = document.querySelectorAll(
      '.EditableProperty'
    ) as NodeListOf<HTMLElement>;
    expect(
      screen.getByRole('heading', { name: 'Directorship' })
    ).toBeInTheDocument();
    expect(properties[0]).toHaveTextContent('Director');
    expect(properties[0]).toHaveTextContent('John Doe');
    expect(properties[1]).toHaveTextContent('Organization');
    expect(properties[1]).toHaveTextContent('ACME, Inc.');

    // Click the property editor and open the select menu
    await userEvent.click(properties[1]);
    await userEvent.click(screen.getByRole('button', { name: 'ACME, Inc.' }));

    // The select menu suggests the two companies
    const suggestions = screen.getAllByRole('menuitem');
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toHaveTextContent('ACME Europe SE');

    // Select a different value and click outside to exit editing mode
    await userEvent.click(suggestions[0]);
    await userEvent.click(document.body);

    // Timeline list and entity viewer display updated caption
    expect(rows[1]).toHaveTextContent('John Doe directs ACME Europe SE');
    expect(properties[1]).toHaveTextContent('Organization');
    expect(properties[1]).toHaveTextContent('ACME Europe SE');
  });
});

it('allows switching between list and chart view', async () => {
  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  render(
    <TimelineContextProvider entities={entities} layout={layout}>
      <TimelineActions writeable={true} />
      <Timeline {...defaultProps} />
    </TimelineContextProvider>
  );

  expect(
    screen.getByRole('button', {
      name: 'List',
      pressed: true,
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('button', {
      name: 'Chart',
      pressed: false,
    })
  ).toBeInTheDocument();

  expect(screen.getByRole('table')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Chart' }));

  expect(
    screen.getByRole('button', {
      name: 'List',
      pressed: false,
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('button', {
      name: 'Chart',
      pressed: true,
    })
  ).toBeInTheDocument();

  expect(screen.getByRole('list')).toBeInTheDocument();
});

it('disables some zoom levels for timelines covering a very long period', async () => {
  const event = model.getEntity({
    id: 'very-long',
    schema: 'Event',
    properties: {
      startDate: ['1960-01-01'],
      endDate: ['2060-01-01'],
    },
  });

  const layout = { vertices: [] };

  render(
    <TimelineContextProvider entities={[event]} layout={layout}>
      <TimelineActions writeable={true} />
      <Timeline {...defaultProps} />
    </TimelineContextProvider>
  );

  // In list view, all zoom level buttons are disabled
  expect(screen.getByRole('button', { name: 'Days' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Months' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Years' })).toBeDisabled();

  await userEvent.click(screen.getByRole('button', { name: 'Chart' }));

  expect(screen.getByRole('button', { name: 'Days' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Months' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Years' })).not.toBeDisabled();

  // The rendered timeline chart defaults to years as days, months are not available
  expect(screen.getByText('1959')).toBeInTheDocument();
  expect(screen.getByText('2061')).toBeInTheDocument();

  // Displays a tooltip explaining why the zoom level is not available
  const tooltipTarget = screen.getByRole('button', { name: 'Days' })
    .parentElement as HTMLElement;

  await userEvent.hover(tooltipTarget);

  expect(
    await screen.findByText(/“Days” view is not available because/)
  ).toBeInTheDocument();
});

it('allows creating new items', async () => {
  // FTM uses crypto.getRandomValues to generate entity IDs.
  // JSDOM doesn't support this API out of the box.
  // TODO: Reenable type checking once we have updated @types/node.
  // @ts-ignore
  global.crypto = crypto.webcrypto;

  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  render(
    <TimelineContextProvider entities={entities} layout={layout}>
      <TimelineActions writeable={true} />
      <Timeline {...defaultProps} />
    </TimelineContextProvider>
  );

  await userEvent.click(screen.getByRole('button', { name: 'Add item' }));

  const dialog = screen.getByRole('dialog', { name: /Add new item/ });
  const submit = screen.getByRole('button', { name: 'Add' });
  expect(dialog).toBeVisible();
  expect(submit).toBeDisabled();

  // 'Event' is the default schema
  expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Start date' }));
  expect(screen.getByRole('textbox', { name: 'End date (optional)' }));

  // Change schema to 'Company'
  await userEvent.click(screen.getByRole('button', { name: 'Type' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Company' }));

  // Property inputs adjust based on schema
  const name = screen.getByRole('textbox', { name: 'Name' });
  const incorporation = screen.getByRole('textbox', {
    name: 'Incorporation date',
  });
  const dissolution = screen.getByRole('textbox', {
    name: 'Dissolution date (optional)',
  });

  expect(name).toBeInTheDocument();
  expect(incorporation).toBeInTheDocument();
  expect(dissolution).toBeInTheDocument();

  await userEvent.type(name, 'ACME, Inc.');
  await userEvent.type(incorporation, '2022-02-15');

  expect(submit).not.toBeDisabled();
  await userEvent.click(submit);

  await waitFor(() => expect(dialog).not.toBeVisible());

  // A new item has been added to the list
  const rows = screen.getAllByRole('row');
  expect(rows).toHaveLength(5); // 4 items + 1 header row
  expect(rows[3]).toHaveTextContent('ACME, Inc.');
});

it('does not allow creating new items if not writeable', () => {
  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  // This is a sanity check to prevent false positives. Because we're testing the absence of elements
  // below, we test that the same elements are actually present for writeable timelines first.
  const { rerender } = render(
    <TimelineContextProvider entities={entities} layout={layout}>
      <TimelineActions writeable={true} />
      <Timeline {...defaultProps} writeable={true} />
    </TimelineContextProvider>
  );

  expect(screen.getByRole('button', { name: 'Add item' }));

  rerender(
    <TimelineContextProvider entities={entities} layout={layout}>
      <TimelineActions writeable={false} />
      <Timeline {...defaultProps} writeable={false} />
    </TimelineContextProvider>
  );

  expect(screen.queryByRole('button', { name: 'Add item' })).toBeNull();
});

it('allows removing entities', async () => {
  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  render(
    <TimelineContextProvider entities={entities} layout={layout}>
      <Timeline {...defaultProps} />
    </TimelineContextProvider>
  );

  let rows = screen.getAllByRole('row');
  expect(rows).toHaveLength(4); // 4 items + 1 header row

  // Remove second item
  await userEvent.click(
    within(rows[2]).getByRole('button', { name: 'Remove' })
  );

  rows = screen.getAllByRole('row');
  expect(rows).toHaveLength(3);
  expect(rows[1]).toHaveTextContent('Event 1');
  expect(rows[2]).toHaveTextContent('Event 3');
});

it('does not allow removing entities if not writeable', () => {
  const entities = [event1, event2, event3];
  const layout = { vertices: [] };

  // This is a sanity check to prevent false positives. Because we're testing the absence of elements
  // below, we test that the same elements are actually present for writeable timelines first.
  const { rerender } = render(
    <TimelineContextProvider entities={entities} layout={layout}>
      <Timeline {...defaultProps} writeable={true} />
    </TimelineContextProvider>
  );

  expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(3);

  rerender(
    <TimelineContextProvider entities={entities} layout={layout}>
      <Timeline {...defaultProps} writeable={false} />
    </TimelineContextProvider>
  );

  expect(screen.queryAllByRole('button', { name: 'Remove' })).toHaveLength(0);
});

describe('Empty state', () => {
  const layout = { vertices: [] };
  const entities: Array<Entity> = [];

  it('displays a message', () => {
    render(
      <TimelineContextProvider entities={entities} layout={layout}>
        <Timeline {...defaultProps} />
      </TimelineContextProvider>
    );
    expect(
      screen.getByRole('heading', { name: 'This timeline is still empty' })
    );
  });

  it('allows creating new items', async () => {
    render(
      <TimelineContextProvider entities={entities} layout={layout}>
        <TimelineActions writeable={true} />
        <Timeline {...defaultProps} />
      </TimelineContextProvider>
    );

    expect(document.body).toHaveTextContent('Add an item to get started.');
    expect(screen.getByRole('button', { name: 'Add item' }));

    await userEvent.click(screen.getByRole('button', { name: 'Add item' }));

    const dialog = screen.getByRole('dialog', { name: /Add new item/ });
    expect(dialog).toBeVisible();
  });

  it('does not allow creating new items if not writeable', () => {
    render(
      <TimelineContextProvider entities={entities} layout={layout}>
        <TimelineActions writeable={false} />
        <Timeline {...defaultProps} writeable={false} />
      </TimelineContextProvider>
    );

    expect(
      screen.queryByRole('button', { name: 'Add item' })
    ).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('Add an item to get started.');
  });
});
