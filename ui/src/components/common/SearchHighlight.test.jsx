import { render } from '@testing-library/react';
import SearchHighlight from './SearchHighlight';

it('renders `em` tags correctly', () => {
  const { container } = render(
    <SearchHighlight highlight={['Lorem <em>ipsum</em> dolor sit amet.']} />
  );

  expect(container).toHaveTextContent('Lorem ipsum dolor sit amet.');
  expect(container.querySelectorAll('em')).toHaveLength(1);
});

it('concatenates multiple fragments', () => {
  const { container } = render(
    <SearchHighlight highlight={['Lorem ispum', 'dolor sit amet.']} />
  );

  expect(container).toHaveTextContent('Lorem ispum … dolor sit amet.');
});
