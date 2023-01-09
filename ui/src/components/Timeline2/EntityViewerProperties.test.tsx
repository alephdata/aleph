import { render, screen } from 'testUtils';
import { Model, defaultModel } from '@alephdata/followthemoney';
import EntityViewerProperties from './EntityViewerProperties';

const model = new Model(defaultModel);

it('renders featured and non-empty properties', () => {
  const entity = model.getEntity({
    id: '1',
    schema: 'Company',
  });

  render(<EntityViewerProperties entity={entity} />);

  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Jurisdiction')).toBeInTheDocument();
  expect(screen.getByText('Registration number')).toBeInTheDocument();
  expect(screen.getByText('Incorporation date')).toBeInTheDocument();
  expect(screen.queryByText('Dissolution date')).not.toBeInTheDocument();

  entity.setProperty('dissolutionDate', '2022-01-01');
  render(<EntityViewerProperties entity={entity} />);

  expect(screen.getByText('Dissolution date')).toBeInTheDocument();
});
