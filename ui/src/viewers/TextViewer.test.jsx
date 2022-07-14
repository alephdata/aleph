import { render } from '@testing-library/react';
import { Model, defaultModel } from '@alephdata/followthemoney';
import TextViewer from './TextViewer';

const model = new Model(defaultModel);

const getPageEntity = (bodyText, highlight) => {
  const entity = model.getEntity({
    schema: 'Page',
    properties: {
      bodyText: [bodyText],
    },
  });

  entity.highlight = highlight;

  return entity;
};

it('renders body text', () => {
  const entity = getPageEntity(
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.'
  );
  const { container } = render(<TextViewer document={entity} />);

  expect(container).toHaveTextContent(
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.'
  );
});

it('displays highlights', () => {
  const entity = getPageEntity(
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    ['sit <em>amet</em>, consectetuer']
  );

  const { container } = render(<TextViewer document={entity} />);

  expect(container).toHaveTextContent(
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.'
  );
  expect(container.querySelectorAll('em')).toHaveLength(1);
});

it('escapes HTML markup', () => {
  const entity = getPageEntity(
    'This document contains <em>HTML markup</em><script>alert()</script>',
    ['This <em>document</em>']
  );

  const { container } = render(<TextViewer document={entity} />);

  expect(container).toHaveTextContent(
    'This document contains <em>HTML markup</em><script>alert()</script>'
  );
  expect(container.querySelectorAll('em')).toHaveLength(1);
  expect(container.querySelector('em')).toHaveTextContent('document');
  expect(container.querySelectorAll('script')).toHaveLength(0);
});
