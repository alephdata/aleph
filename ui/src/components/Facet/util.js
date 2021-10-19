const DEFAULT_START_INTERVAL = 1950;

const formatDateQParam = (datetime, granularity) => {
  const date = datetime.split('T')[0]
  if (granularity === 'month') {
    return `${date}||/M`
  } else if (granularity === 'day') {
    return `${date}||/d`
  }
  return `${date}||/y`
};

const cleanDateQParam = (value) => {
  return value
    .replace('||/y', '')
    .replace('||/M', '')
    .replace('||/d', '');
};

const timestampToLabel = (timestamp, granularity, locale) => {
  const dateObj = new Date(timestamp)

  if (granularity === 'month') {
    return new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj)
  } else if (granularity === 'day') {
    return `${dateObj.getDate()}`
  }
  return dateObj.getFullYear()
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

  const gt = gtRaw && new Date(`${gtRaw}T00:00:00`)
  const lt = ltRaw && new Date(`${ltRaw}T00:00:00`)

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
  timestampToLabel,
  filterDateIntervals
}
