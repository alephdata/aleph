import { render, screen } from 'testUtils';
import { Entity, Model, defaultModel } from '@alephdata/followthemoney';
import EntityViewer from './EntityViewer';

const model = new Model(defaultModel);
let entity: Entity;

beforeEach(() => {
  entity = model.getEntity({
    id: '1',
    schema: 'Company',
    properties: {
      name: ['ACME, Inc.'],
    },
  });
});

it('renders schema name and entity caption', () => {
  render(<EntityViewer entity={entity} />);
  expect(screen.getByText('Company')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'ACME, Inc.' }));
});

it('renders a color picker', () => {
  const vertex = { entityId: '1', color: 'green' };
  render(<EntityViewer entity={entity} vertex={vertex} />);
  const picker = document.querySelector(
    '.ColorPicker [style*="background-color: green"]'
  );
  expect(picker).toBeInTheDocument();
});

it('renders properties', () => {
  render(<EntityViewer entity={entity} />);
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Incorporation date')).toBeInTheDocument();
});
