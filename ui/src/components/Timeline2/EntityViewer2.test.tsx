import { render, screen } from 'testUtils';
import { Entity, Model, defaultModel } from '@alephdata/followthemoney';
import EntityViewer2 from './EntityViewer2';

const defaultProps = {
  fetchEntitySuggestions: async () => [],
  writeable: true,
  onVertexChange: () => {},
  onEntityChange: () => {},
};

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
  const vertex = { entityId: '1' };
  render(<EntityViewer2 {...defaultProps} entity={entity} vertex={vertex} />);
  expect(screen.getByText('Company')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'ACME, Inc.' }));
});

it('renders a color picker', () => {
  const vertex = { entityId: '1', color: 'green' };
  render(<EntityViewer2 {...defaultProps} entity={entity} vertex={vertex} />);
  const picker = document.querySelector(
    '.ColorPicker [style*="background-color: green"]'
  );
  expect(picker).toBeInTheDocument();
});

it('renders properties', () => {
  const vertex = { entityId: '1' };
  render(<EntityViewer2 {...defaultProps} entity={entity} vertex={vertex} />);
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Incorporation date')).toBeInTheDocument();
});
