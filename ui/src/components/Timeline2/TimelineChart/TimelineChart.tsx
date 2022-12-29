import { FC, CSSProperties } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import { differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { useTimelineKeyboardNavigation } from '../util';
import type { TimelineRendererProps } from '../types';
import TimelineChartGrid from './TimelineChartGrid';
import TimelineChartLabels from './TimelineChartLabels';
import TimelineChartItem from './TimelineChartItem';

import './TimelineChart.scss';

const TimelineChart: FC<TimelineRendererProps> = ({
  items,
  selectedId,
  onSelect,
  onUnselect,
}) => {
  const earliestDate = items
    .map((item) => item.getEarliestDate())
    .filter((date): date is Date => date !== undefined)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const latestDate = items
    .map((item) => item.getLatestDate())
    .filter((date): date is Date => date !== undefined)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const start = startOfMonth(earliestDate);
  const end = endOfMonth(latestDate);

  const days = differenceInDays(end, start) + 1;

  const style: CSSProperties = {
    ['--timeline-chart-days' as string]: days,
  };

  const [itemRefs, keyboardProps] =
    useTimelineKeyboardNavigation<HTMLLIElement>(items, onUnselect);

  return (
    <div
      {...keyboardProps}
      className={c('TimelineChart', Classes.FOCUS_STYLE_MANAGER_IGNORE)}
      style={style}
    >
      <TimelineChartGrid start={start} end={end} />
      <TimelineChartLabels start={start} end={end} />
      <ul className="TimelineChart__list">
        {items.map((item, index) => (
          <TimelineChartItem
            key={item.entity.id}
            timelineStart={start}
            item={item}
            selected={selectedId === item.entity.id}
            muted={!!selectedId && selectedId !== item.entity.id}
            onSelect={onSelect}
            ref={itemRefs[index]}
          />
        ))}
      </ul>
    </div>
  );
};

export default TimelineChart;
