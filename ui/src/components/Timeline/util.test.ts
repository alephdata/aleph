import { Model, defaultModel } from '@alephdata/followthemoney';
import { TimelineItem, ImpreciseDate, reformatDateString } from './util';

const model = new Model(defaultModel);

describe('TimelineItem', () => {
  describe('getColor()', () => {
    it('returns default color', () => {
      const layout = {
        vertices: [],
      };

      const event = model.getEntity({
        schema: 'Event',
        id: '123',
      });

      const item = new TimelineItem(event, layout);
      expect(item.getColor()).toEqual('#215DB0');
    });

    it('returns color from layout based on entity ID', () => {
      const layout = {
        vertices: [
          { entityId: '456', color: 'green' },
          { entityId: '123', color: 'red' },
        ],
      };

      const event = model.getEntity({
        schema: 'Event',
        id: '123',
      });

      const item = new TimelineItem(event, layout);
      expect(item.getColor()).toEqual('red');
    });
  });

  describe('getEarliestDate() and getLatestDate()', () => {
    it('handle entities without temporal extent', () => {
      const event = model.getEntity({ schema: 'Event', id: '123' });
      const item = new TimelineItem(event);

      expect(item.getEarliestDate()).toBeUndefined();
      expect(item.getLatestDate()).toBeUndefined();
    });

    it('return start and end date', () => {
      const event1 = model.getEntity({
        schema: 'Event',
        id: '123',
        properties: {
          startDate: ['2022-01'],
        },
      });

      const item1 = new TimelineItem(event1);
      expect(item1.getEarliestDate()).toEqual(new Date(2022, 0, 1));
      expect(item1.getLatestDate()).toEqual(new Date(2022, 0, 31));

      const event2 = model.getEntity({
        schema: 'Event',
        id: '123',
        properties: {
          startDate: ['2022-01'],
          endDate: ['2022-02'],
        },
      });

      const item2 = new TimelineItem(event2);
      expect(item2.getEarliestDate()).toEqual(new Date(2022, 0, 1));
      expect(item2.getLatestDate()).toEqual(new Date(2022, 1, 28));
    });
  });

  describe('getDuration()', () => {
    it('handles entities without temporal end', () => {
      const event = model.getEntity({
        schema: 'Event',
        id: '123',
        properties: {
          startDate: ['2022-01-15'],
        },
      });

      const item = new TimelineItem(event);
      expect(item.getDuration()).toEqual(1);
    });

    it('handles entities with temporal start and end', () => {
      const event = model.getEntity({
        schema: 'Event',
        id: '123',
        properties: {
          startDate: ['2022-01-01'],
          endDate: ['2022-01-15'],
        },
      });

      const item = new TimelineItem(event);
      expect(item.getDuration()).toEqual(15);
    });
  });

  describe('isMultiDay() and isSingleDay()', () => {
    it('handles entities without temporal end', () => {
      const event = model.getEntity({
        schema: 'Event',
        id: '123',
        properties: {
          startDate: ['2022-01-15'],
        },
      });

      const item = new TimelineItem(event);
      expect(item.isSingleDay()).toBe(true);
      expect(item.isMultiDay()).toBe(false);
    });

    it('handles entities with imprecise dates', () => {
      const event = model.getEntity({
        schema: 'Event',
        id: '123',
        properties: {
          startDate: ['2022-01'],
        },
      });

      const item = new TimelineItem(event);
      expect(item.isSingleDay()).toBe(false);
      expect(item.isMultiDay()).toBe(true);
    });

    it('handles entities with temporal start and end', () => {
      const event = model.getEntity({
        schema: 'Event',
        id: '123',
        properties: {
          startDate: ['2022-01-01'],
          endDate: ['2022-01-15'],
        },
      });

      const item = new TimelineItem(event);
      expect(item.isSingleDay()).toBe(false);
      expect(item.isMultiDay()).toBe(true);
    });
  });
});

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

describe('reformatDateString', () => {
  it('returns original value if format is not recognized', () => {
    expect(reformatDateString('what is this')).toEqual('what is this');
  });

  it('returns original value if format is already supported', () => {
    expect(reformatDateString('2022')).toEqual('2022');
    expect(reformatDateString('2022-1')).toEqual('2022-1');
    expect(reformatDateString('2022-01')).toEqual('2022-01');
    expect(reformatDateString('2022-1-1')).toEqual('2022-1-1');
    expect(reformatDateString('2022-01-01')).toEqual('2022-01-01');
  });

  it('reformats values to use hyphens', () => {
    expect(reformatDateString('20220')).toEqual('2022-0');
    expect(reformatDateString('202201')).toEqual('2022-01');
    expect(reformatDateString('2022010')).toEqual('2022-01-0');
    expect(reformatDateString('2022-010')).toEqual('2022-01-0');
    expect(reformatDateString('20220101')).toEqual('2022-01-01');
    expect(reformatDateString('2022-0101')).toEqual('2022-01-01');
  });
});
