import { FC } from 'react';
import c from 'classnames';
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  addDays,
} from 'date-fns';
import { TimelineChartZoomLevel } from '../types';

import './TimelineChartGrid.scss';

type TimelineChartGridProps = {
  start: Date;
  end: Date;
  zoomLevel: TimelineChartZoomLevel;
};

const generateLines = (
  zoomLevel: TimelineChartZoomLevel,
  start: Date,
  end: Date
) => {
  if (zoomLevel === 'days') {
    return eachDayOfInterval({ start, end }).map((date) => ({
      date,
      startDay: differenceInDays(date, start),
      isMain: date.getDate() === 1,
    }));
  }

  if (zoomLevel === 'months') {
    return eachMonthOfInterval({ start, end }).map((date) => ({
      date,
      startDay: differenceInDays(date, start),
      isMain: date.getDate() === 1 && date.getMonth() === 0,
    }));
  }

  return eachMonthOfInterval({ start, end }).map((date) => ({
    date,
    startDay: differenceInDays(date, start),
    isMain: date.getDate() === 1 && date.getMonth() === 0,
  }));
};

const TimelineChartGrid: FC<TimelineChartGridProps> = ({
  start,
  end,
  zoomLevel,
}) => {
  const lines = generateLines(zoomLevel, start, addDays(end, 1));

  return (
    <div className="TimelineChartGrid">
      {lines.map(({ date, startDay, isMain }) => (
        <div
          key={date.getTime()}
          style={{
            ['--timeline-chart-grid-line-start-day' as string]: startDay,
          }}
          className={c(
            'TimelineChartGrid__line',
            isMain && 'TimelineChartGrid__line--main'
          )}
        />
      ))}
    </div>
  );
};

export default TimelineChartGrid;
