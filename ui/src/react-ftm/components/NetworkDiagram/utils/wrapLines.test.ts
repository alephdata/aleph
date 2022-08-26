import { wrapLines } from './wrapLines';

describe('wrapLines', () => {
  it('doesnt break text shorter than maximum line length', () => {
    const lines = wrapLines('a very short line', 25);
    expect(lines).toEqual(['a very short line']);
  });

  it('breaks text longer than maximum line length', () => {
    const lines = wrapLines('a very very very very long line', 25);
    expect(lines).toEqual(['a very very very very', 'long line']);
  });

  it('breaks lines after punctuation', () => {
    const lines = wrapLines(
      'This is the 1st sentence. And this is the 2nd sentence.',
      25
    );
    expect(lines).toEqual([
      'This is the 1st sentence.',
      'And this is the 2nd',
      'sentence.',
    ]);
  });
});
