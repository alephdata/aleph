import { FC } from 'react';
import c from 'classnames';
import { eachDayOfInterval, differenceInDays, addDays } from 'date-fns';

import './TimelineChartGrid.scss';

type TimelineChartGridProps = {
  start: Date;
  end: Date;
};

const TimelineChartGrid: FC<TimelineChartGridProps> = ({ start, end }) => {
  const lines = eachDayOfInterval({ start, end: addDays(end, 1) }).map(
    (date) => ({
      date,
      startDay: differenceInDays(date, start),
      isMain: date.getDate() === 1,
    })
  );

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
