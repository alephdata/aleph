import { ImpreciseDate } from './util';

describe('ImpreciseDate', () => {
  describe('constructor()', () => {
    it('parses valid dates', () => {
      let date: ImpreciseDate;

      date = new ImpreciseDate('2022');
      expect(date.isValid()).toBe(true);
      expect(date.year).toEqual(2022);
      expect(date.month).toBeUndefined();
      expect(date.day).toBeUndefined();

      date = new ImpreciseDate('2022-01');
      expect(date.isValid()).toBe(true);
      expect(date.year).toEqual(2022);
      expect(date.month).toEqual(1);
      expect(date.day).toBeUndefined();

      date = new ImpreciseDate('2022-1');
      expect(date.isValid()).toBe(true);
      expect(date.year).toEqual(2022);
      expect(date.month).toEqual(1);
      expect(date.day).toBeUndefined();

      date = new ImpreciseDate('2022-01-02');
      expect(date.isValid()).toBe(true);
      expect(date.year).toEqual(2022);
      expect(date.month).toEqual(1);
      expect(date.day).toEqual(2);

      date = new ImpreciseDate('2022-1-2');
      expect(date.isValid()).toBe(true);
      expect(date.year).toEqual(2022);
      expect(date.month).toEqual(1);
      expect(date.day).toEqual(2);

      // Leap year
      date = new ImpreciseDate('2024-02-29');
      expect(date.isValid()).toBe(true);
      expect(date.year).toEqual(2024);
      expect(date.month).toEqual(2);
      expect(date.day).toEqual(29);
    });

    it('handles invalid dates', () => {
      const dates = [
        new ImpreciseDate(''),
        new ImpreciseDate('2022-'),
        new ImpreciseDate('2022-0'),
        new ImpreciseDate('2022-13'),
        new ImpreciseDate('2022-123'),
        new ImpreciseDate('2022-01-'),
        new ImpreciseDate('2022-01-0'),
        new ImpreciseDate('2022-01-123'),
        new ImpreciseDate('2022-01-01-'),
        new ImpreciseDate('2022-02-29'),
        new ImpreciseDate('2022-04-31'),
        new ImpreciseDate('2022-01-32'),
      ];

      const validDates = dates.filter((date) => date.isValid());
      expect(validDates).toHaveLength(0);
    });
  });

  describe('getEarliest() and getLatest()', () => {
    let date: ImpreciseDate;

    date = new ImpreciseDate('2022-01-01');
    expect(date.getEarliest()).toEqual(new Date(2022, 0, 1));
    expect(date.getLatest()).toEqual(new Date(2022, 0, 1));

    date = new ImpreciseDate('2022-02');
    expect(date.getEarliest()).toEqual(new Date(2022, 1, 1));
    expect(date.getLatest()).toEqual(new Date(2022, 1, 28));

    date = new ImpreciseDate('2024-02');
    expect(date.getEarliest()).toEqual(new Date(2024, 1, 1));
    expect(date.getLatest()).toEqual(new Date(2024, 1, 29));

    date = new ImpreciseDate('2022');
    expect(date.getEarliest()).toEqual(new Date(2022, 0, 1));
    expect(date.getLatest()).toEqual(new Date(2022, 11, 31));
  });
});
