import { reduceTranslucentColor } from './reduceTranslucentColor';

it('returns HEX representation of color on white background', () => {
  const result = reduceTranslucentColor('#000000', 0.5);
  expect(result).toEqual('#808080');
});

it('handles invalid HEX strings', () => {
  expect(reduceTranslucentColor('#gghhii', 0.5)).toBeNull();
});
