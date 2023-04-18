import { render, screen } from 'testUtils';
import userEvent from '@testing-library/user-event';
import { Entity, Model, defaultModel } from '@alephdata/followthemoney';
import EntityViewerProperties from './EntityViewerProperties';

const defaultProps = {
  fetchEntitySuggestions: async () => [],
  writeable: true,
  onChange: () => {},
};

const model = new Model(defaultModel);
let entity: Entity;

beforeEach(() => {
  entity = model.getEntity({
    id: '1',
    schema: 'Company',
  });
});

it('renders featured, temporal, and non-empty properties', () => {
  const { rerender } = render(
    <EntityViewerProperties {...defaultProps} entity={entity} />
  );

  // Featured
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Jurisdiction')).toBeInTheDocument();
  expect(screen.getByText('Registration number')).toBeInTheDocument();

  // Temporal
  expect(screen.getByText('Incorporation date')).toBeInTheDocument();
  expect(screen.getByText('Dissolution date')).toBeInTheDocument();

  // Non empty
  entity.setProperty('wikidataId', 'Q7102061');
  rerender(<EntityViewerProperties {...defaultProps} entity={entity} />);
  expect(screen.getByText('Wikidata ID')).toBeInTheDocument();
});

it('can add any other editable property', async () => {
  render(<EntityViewerProperties {...defaultProps} entity={entity} />);

  // There is no editor for the Wikidata ID
  expect(screen.queryByText('Wikidata ID')).toBeNull();

  await userEvent.click(screen.getByRole('button', { name: 'Add a property' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Wikidata ID' }));

  // Now there is an editor for the dissolution date
  expect(screen.getByText('Wikidata ID').matches('.EditableProperty *')).toBe(
    true
  );

  // Can't add a property twice
  await userEvent.click(screen.getByRole('button', { name: 'Add a property' }));
  expect(screen.queryByRole('menuitem', { name: 'Wikidata ID' })).toBeNull();
});

it('cannot add properties if not writeable', () => {
  render(
    <EntityViewerProperties
      {...defaultProps}
      writeable={false}
      entity={entity}
    />
  );

  expect(screen.queryByRole('button', { name: 'Add a property' })).toBeNull();
});
