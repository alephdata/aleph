import { FC } from 'react';
import { FormattedDate } from 'react-intl';
import {
  eachMonthOfInterval,
  eachYearOfInterval,
  differenceInDays,
  addMonths,
  addYears,
} from 'date-fns';
import { TimelineChartZoomLevel } from '../types';

import './TimelineChartLabels.scss';

type TimelineChartLabelsProps = {
  start: Date;
  end: Date;
  zoomLevel: TimelineChartZoomLevel;
};

const generateLabels = (
  zoomLevel: TimelineChartZoomLevel,
  start: Date,
  end: Date
) => {
  if (zoomLevel === 'days' || zoomLevel === 'months') {
    return eachMonthOfInterval({ start, end }).map((date) => ({
      date,
      startDay: differenceInDays(date, start),
      endDay: differenceInDays(addMonths(date, 1), start),
    }));
  }

  return eachYearOfInterval({ start, end }).map((date) => ({
    date,
    startDay: differenceInDays(date, start),
    endDay: differenceInDays(addYears(date, 1), start),
  }));
};

const TimelineChartLabels: FC<TimelineChartLabelsProps> = ({
  start,
  end,
  zoomLevel,
}) => {
  const labels = generateLabels(zoomLevel, start, end);

  return (
    <div className="TimelineChartLabels">
      {labels.map(({ date, startDay, endDay }, index) => (
        <div
          key={index}
          className="TimelineChartLabels__label"
          style={{
            ['--timeline-chart-label-start-day' as string]: startDay,
            ['--timeline-chart-label-end-day' as string]: endDay,
          }}
        >
          <span className="TimelineChartLabels__text" aria-hidden="true">
            <FormattedDate
              value={date}
              month={zoomLevel !== 'years' ? 'short' : undefined}
              year="numeric"
            />
          </span>
        </div>
      ))}
    </div>
  );
};

export default TimelineChartLabels;
