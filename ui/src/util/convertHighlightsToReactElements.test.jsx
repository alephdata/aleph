import { render } from '@testing-library/react';
import convertHighlightsToReactElements from './convertHighlightsToReactElements';

it('converts `em` tags to React nodes', () => {
  const { container } = render(
    <div>
      {convertHighlightsToReactElements(
        'Lorem ipsum <em>dolor</em> sit <em>amet</em>.'
      )}
    </div>
  );

  expect(container).toHaveTextContent('Lorem ipsum dolor sit amet.');

  const emTags = [...container.querySelectorAll('em')];
  const highlighted = emTags.map((tag) => tag.textContent);
  expect(highlighted).toEqual(['dolor', 'amet']);
});

it('escapes all other HTML markup', () => {
  const { container } = render(
    <div>
      {convertHighlightsToReactElements("<script>alert('XSS!')</script>")}
    </div>
  );

  expect(container).toHaveTextContent("<script>alert('XSS!')</script>");
  expect(container.querySelector('script')).toBeNull();
});
