import { getStart, getEnd } from './util';

describe('getStart', () => {
  it('returns start of month/year depending on zoom level', () => {
    const earliestDate = new Date('2020-03-01');
    const latestDate = new Date('2030-03-01');
    expect(getStart('days', earliestDate, latestDate)).toEqual(
      new Date('2020-02-01')
    );
    expect(getStart('months', earliestDate, latestDate)).toEqual(
      new Date('2020-02-01')
    );
    expect(getStart('years', earliestDate, latestDate)).toEqual(
      new Date('2019-01-01')
    );
  });

  it('adds padding before earliest date if timeline range is small', () => {
    const earliestDate = new Date('2020-03-01');
    const latestDate = new Date('2020-03-01');
    expect(getStart('days', earliestDate, latestDate)).toEqual(
      new Date('2019-12-01')
    );
    expect(getStart('months', earliestDate, latestDate)).toEqual(
      new Date('2019-03-01')
    );
    expect(getStart('years', earliestDate, latestDate)).toEqual(
      new Date('2017-01-01')
    );
  });
});

describe('getEnd', () => {
  it('returns end of month/year depending on zoom level', () => {
    const earliestDate = new Date('2010-03-01');
    const latestDate = new Date('2020-03-01');
    expect(getEnd('days', earliestDate, latestDate)).toEqual(
      new Date('2020-04-30T23:59:59.999')
    );
    expect(getEnd('months', earliestDate, latestDate)).toEqual(
      new Date('2020-04-30T23:59:59.999')
    );
    expect(getEnd('years', earliestDate, latestDate)).toEqual(
      new Date('2021-12-31T23:59:59.999')
    );
  });

  it('adds padding after latest date if timeline range is small', () => {
    const earliestDate = new Date('2020-03-01');
    const latestDate = new Date('2020-03-01');
    expect(getEnd('days', earliestDate, latestDate)).toEqual(
      new Date('2020-06-30T23:59:59.999')
    );
    expect(getEnd('months', earliestDate, latestDate)).toEqual(
      new Date('2021-03-31T23:59:59.999')
    );
    expect(getEnd('years', earliestDate, latestDate)).toEqual(
      new Date('2023-12-31T23:59:59.999')
    );
  });
});
