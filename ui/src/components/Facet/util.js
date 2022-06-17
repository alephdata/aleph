// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import moment from 'moment';

const DEFAULT_START_INTERVAL = '1950';

const formatDateQParam = (datetime, granularity) => {
  const date = moment.utc(datetime).format("YYYY-MM-DD")
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
    return moment.utc(date).format('YYYY')
  } else if (suffix === 'M') {
    return moment.utc(date).format('YYYY-MM')
  } else {
    return date;
  }
};

const timestampToLabel = (timestamp, granularity, locale) => {
  const dateObj = new Date(timestamp)
  let label, tooltipLabel;

  if (granularity === 'month') {
    label = new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj)
    tooltipLabel = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(dateObj)
  } else if (granularity === 'day') {
    label = dateObj.getDate()
    tooltipLabel = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', day: 'numeric' }).format(dateObj)
  } else {
    label = tooltipLabel = dateObj.getFullYear();
  }

  return ({ label, tooltipLabel })
}

const filterDateIntervals = ({ field, query, intervals, useDefaultBounds }) => {
  const defaultEndInterval = moment.utc().format('YYYY-MM-DD');
  const hasGtFilter = query.hasFilter(`gte:${field}`);
  const hasLtFilter = query.hasFilter(`lte:${field}`);

  const gtRaw = hasGtFilter
    ? cleanDateQParam(query.getFilter(`gte:${field}`)[0])
    : (useDefaultBounds && DEFAULT_START_INTERVAL);

  const ltRaw = hasLtFilter
    ? cleanDateQParam(query.getFilter(`lte:${field}`)[0])
    : (useDefaultBounds && defaultEndInterval);

  const gt = gtRaw && moment(gtRaw)
  const lt = ltRaw && moment(ltRaw)

  let gtOutOfRange, ltOutOfRange = false;
  const filteredIntervals = intervals.filter(({ id }) => {
    if (gt && gt.isAfter(id)) {
      gtOutOfRange = true;
      return false;
    }
    if (lt && lt.isBefore(id)) {
      ltOutOfRange = true;
      return false;
    }
    return true;
  })

  const hasOutOfRange = useDefaultBounds && ((!hasGtFilter && gtOutOfRange) || (!hasLtFilter && ltOutOfRange));

  return { filteredIntervals, hasOutOfRange };
}

const isDateIntervalUncertain = (timestamp, granularity) => {
  const dateObj = moment.utc(timestamp)

  if (granularity === 'month' && dateObj.month() === 0) {
    return true;
  } else if (granularity === 'day' && dateObj.date() === 1) {
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
