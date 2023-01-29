import { render } from '@testing-library/react';
import TimelineItemCaption from './TimelineItemCaption';
import { Model, defaultModel } from '@alephdata/followthemoney';

const model = new Model(defaultModel);

it('renders caption for non-edge entities', () => {
  const entity = model.getEntity({
    id: '1',
    schema: 'Event',
    properties: { name: ['Lorem ipsum'] },
  });

  const { container } = render(<TimelineItemCaption entity={entity} />);
  expect(container).toHaveTextContent('Lorem ipsum');
});

it('renders caption composed of source and target', () => {
  const company = model.getEntity({
    id: '1',
    schema: 'Company',
    properties: { name: ['Los Pollos Hermanos'] },
  });

  const director = model.getEntity({
    id: '2',
    schema: 'Person',
    properties: { name: ['Gustavo Fring'] },
  });

  const directorship = model.getEntity({
    id: '3',
    schema: 'Directorship',
    properties: {
      director: [director],
      organization: [company],
    },
  });

  const { container } = render(<TimelineItemCaption entity={directorship} />);
  expect(container).toHaveTextContent(
    'Gustavo Fring directs Los Pollos Hermanos'
  );
});
