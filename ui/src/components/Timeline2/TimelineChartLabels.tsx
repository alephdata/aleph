import { FC } from 'react';
import { FormattedDate } from 'react-intl';
import { eachMonthOfInterval, differenceInDays, addMonths } from 'date-fns';

import './TimelineChartLabels.scss';

type TimelineChartLabelsProps = {
  start: Date;
  end: Date;
};

const TimelineChartLabels: FC<TimelineChartLabelsProps> = ({ start, end }) => {
  const labels = eachMonthOfInterval({ start, end }).map((date) => ({
    date,
    startDay: differenceInDays(date, start),
    endDay: differenceInDays(addMonths(date, 1), start),
  }));

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
            <FormattedDate value={date} month="short" year="numeric" />
          </span>
        </div>
      ))}
    </div>
  );
};

export default TimelineChartLabels;
