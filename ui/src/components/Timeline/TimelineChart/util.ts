import {
  differenceInMonths,
  differenceInYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addMonths,
  addYears,
  subMonths,
  subYears,
} from 'date-fns';
import { TimelineChartZoomLevel } from '../types';

/**
 * When a timelines has only very few events or the events cover only a very short time
 * period the chart view would be significantly smaller than the viewport width. We apply
 * some padding on the left and right in those cases. How much padding is applied depends
 * on the zoom level. For example, in the "years" zomm level, a maximum of two years padding
 * will be applied to each side.
 */
function getPadding(
  zoomLevel: TimelineChartZoomLevel,
  earliestDate: Date,
  latestDate: Date
) {
  if (zoomLevel === 'days') {
    const diff = Math.abs(differenceInMonths(latestDate, earliestDate));
    return Math.max(1, 3 - diff); // in months
  }

  if (zoomLevel === 'months') {
    const diff = Math.abs(differenceInMonths(latestDate, earliestDate));
    return Math.max(1, 12 - diff); // in months
  }

  const diff = Math.abs(differenceInYears(latestDate, earliestDate));
  return Math.max(1, 3 - diff); // in years
}

export function getStart(
  zoomLevel: TimelineChartZoomLevel,
  earliestDate: Date,
  latestDate: Date
) {
  const padding = getPadding(zoomLevel, earliestDate, latestDate);

  if (zoomLevel === 'days' || zoomLevel === 'months') {
    return subMonths(startOfMonth(earliestDate), padding);
  }

  return subYears(startOfYear(earliestDate), padding);
}

export function getEnd(
  zoomLevel: TimelineChartZoomLevel,
  earliestDate: Date,
  latestDate: Date
) {
  const padding = getPadding(zoomLevel, earliestDate, latestDate);

  if (zoomLevel === 'days' || zoomLevel === 'months') {
    return addMonths(endOfMonth(latestDate), padding);
  }

  return addYears(endOfYear(latestDate), padding);
}
