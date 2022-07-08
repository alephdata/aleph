import insertHighlights from './insertHighlights';

it('inserts highlighted snippets in full text', () => {
  const text =
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo' +
    'ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis';

  const highlights = [
    'Lorem ipsum <em>dolor sit amet</em>',
    'Aenean <em>massa</em>',
  ];

  expect(insertHighlights(text, highlights)).toEqual(
    'Lorem ipsum <em>dolor sit amet</em>, consectetuer adipiscing elit. Aenean commodo' +
      'ligula eget dolor. Aenean <em>massa</em>. Cum sociis natoque penatibus et magnis dis'
  );
});

it('handles highlights that span multiple lines', () => {
  const text = 'This is the first line.\nThis is the second line.';
  const highlights = ['first <em>line</em>.\nThis'];

  expect(insertHighlights(text, highlights)).toEqual(
    'This is the first <em>line</em>.\nThis is the second line.'
  );
});

it('handles HTML-escaped highlights', () => {
  const text = 'https://occrp.org/';
  const highlights = ['https:&#x2F;&#x2F;<em>occrp</em>.org&#x2F;'];

  expect(insertHighlights(text, highlights)).toEqual(
    'https:&#x2F;&#x2F;<em>occrp</em>.org&#x2F;'
  );
});
