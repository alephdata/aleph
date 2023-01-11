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

it('renders featured and non-empty properties', () => {
  render(<EntityViewerProperties {...defaultProps} entity={entity} />);

  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Jurisdiction')).toBeInTheDocument();
  expect(screen.getByText('Registration number')).toBeInTheDocument();
  expect(screen.getByText('Incorporation date')).toBeInTheDocument();
  expect(screen.queryByText('Dissolution date')).toBeNull();

  entity.setProperty('dissolutionDate', '2022-01-01');
  render(<EntityViewerProperties {...defaultProps} entity={entity} />);

  expect(screen.getByText('Dissolution date')).toBeInTheDocument();
});

it('can add any other editable property', async () => {
  render(<EntityViewerProperties {...defaultProps} entity={entity} />);

  // There is no editor for the dissolution date
  expect(screen.queryByText('Dissolution date')).toBeNull();

  await userEvent.click(screen.getByRole('button', { name: 'Add a property' }));
  await userEvent.click(
    screen.getByRole('menuitem', { name: 'Dissolution date' })
  );

  // Now there is an editor for the dissolution date
  expect(
    screen.getByText('Dissolution date').matches('.EditableProperty *')
  ).toBe(true);

  // Can't add a property twice
  await userEvent.click(screen.getByRole('button', { name: 'Add a property' }));
  expect(
    screen.queryByRole('menuitem', { name: 'Dissolution date' })
  ).toBeNull();
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
