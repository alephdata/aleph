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
  if (!value) { return; }
  const [date, suffix] = value.split('||/');

  if (suffix === 'y') {
    return date.split('-')[0]
  } else if (suffix === 'M') {
    const dateParts = date.split('-')
    return [dateParts[0], dateParts[1]].join('-')
  } else {
    return date;
  }
};

const timestampToLabel = (timestamp, granularity, locale, isUncertain) => {
  const dateObj = new Date(timestamp)
  let label, tooltipLabel;

  if (granularity === 'month') {
    label = new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj)
    tooltipLabel = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(dateObj)

    if (isUncertain) {
      tooltipLabel = `${dateObj.getFullYear()} / ${tooltipLabel}`
    }
  } else if (granularity === 'day') {
    label = dateObj.getDate()
    tooltipLabel = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', day: 'numeric' }).format(dateObj)

    if (isUncertain) {
      const uncertainMonth = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(dateObj)

      if (dateObj.getMonth() === 0) {
        tooltipLabel = `${dateObj.getFullYear()} / ${uncertainMonth} / ${tooltipLabel}`
      } else {
        tooltipLabel = `${uncertainMonth} / ${tooltipLabel}`
      }
    }
  } else {
    label = tooltipLabel = dateObj.getFullYear();
  }

  return ({ label, tooltipLabel })
}

const filterDateIntervals = ({ field, query, intervals, useDefaultBounds }) => {
  const defaultEndInterval = new Date().getFullYear();
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

const isDateIntervalUncertain = (timestamp, granularity) => {
  const dateObj = new Date(timestamp)

  if (granularity === 'month' && dateObj.getMonth() === 0) {
    return true;
  } else if (granularity === 'day' && dateObj.getDate() === 1) {
    return true;
  }

  return false;
}

export {
  cleanDateQParam,
  DEFAULT_START_INTERVAL,
  formatDateQParam,
  timestampToLabel,
  isDateIntervalUncertain,
  filterDateIntervals
}
