const DEFAULT_START_INTERVAL = 1950;
const ES_SUFFIX = '||/y';

const formatDateQParam = (datetime) => {
  return `${new Date(datetime).getFullYear()}||/y`
};

const cleanDateQParam = (value) => {
  return value.replace(ES_SUFFIX, '');
};

const timestampToYear = timestamp => {
  return new Date(timestamp).getFullYear();
}

const filterDateIntervals = ({ query, intervals, useDefaultBounds }) => {
  const defaultEndInterval = new Date().getFullYear();
  const hasGtFilter = query.hasFilter('gte:dates');
  const hasLtFilter = query.hasFilter('lte:dates');

  const gt = hasGtFilter
    ? cleanDateQParam(query.getFilter('gte:dates')[0])
    : (useDefaultBounds && DEFAULT_START_INTERVAL);

  const lt = hasLtFilter
    ? cleanDateQParam(query.getFilter('lte:dates')[0])
    : (useDefaultBounds && defaultEndInterval);

  let gtOutOfRange, ltOutOfRange = false;

  const filteredIntervals = intervals.filter(({ id }) => {
    const year = timestampToYear(id);
    if (gt && year < gt) {
      gtOutOfRange = true;
      return false;
    }
    if (lt && year > lt) {
      ltOutOfRange = true;
      return false;
    }
    return true;
  })

  const hasOutOfRange = useDefaultBounds && ((!hasGtFilter && gtOutOfRange) || (!hasLtFilter && ltOutOfRange));
  return { filteredIntervals, hasOutOfRange };
}

export {
  cleanDateQParam,
  DEFAULT_START_INTERVAL,
  formatDateQParam,
  timestampToYear,
  filterDateIntervals
}
