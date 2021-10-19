const DEFAULT_START_INTERVAL = 1950;

const formatDateQParam = (datetime, granularity) => {
  const dateObj = new Date(datetime)
  if (granularity === 'month') {
    return `${datetime}||/M`
  }
  return `${datetime}||/y`
};

const cleanDateQParam = (value) => {
  return value
    .replace('||/y', '')
    .replace('||/M', '');
};

const timestampToYear = timestamp => {
  return new Date(timestamp).getFullYear();
}

const filterDateIntervals = ({ field, query, intervals, useDefaultBounds }) => {
  const defaultEndInterval = new Date();
  const hasGtFilter = query.hasFilter(`gte:${field}`);
  const hasLtFilter = query.hasFilter(`lte:${field}`);

  const gtRaw = hasGtFilter
    ? cleanDateQParam(query.getFilter(`gte:${field}`)[0])
    : (useDefaultBounds && DEFAULT_START_INTERVAL);

  const ltRaw = hasLtFilter
    ? cleanDateQParam(query.getFilter(`lte:${field}`)[0])
    : (useDefaultBounds && defaultEndInterval);

  const gt = gtRaw && new Date(gtRaw)
  const lt = ltRaw && new Date(ltRaw)

  let gtOutOfRange, ltOutOfRange = false;
  const filteredIntervals = intervals.filter(({ id }) => {
    const date = new Date(id)
    if (gt && date < gt) {
      gtOutOfRange = true;
      return false;
    }
    if (lt && date > lt) {
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
