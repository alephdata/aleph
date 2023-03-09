import { FC, CSSProperties, useState } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import {
  differenceInDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { useTimelineKeyboardNavigation } from '../util';
import type { TimelineRendererProps, TimelineChartZoomLevel } from '../types';
import { TimelineItem } from '../util';
import TimelineChartGrid from './TimelineChartGrid';
import TimelineChartLabels from './TimelineChartLabels';
import TimelineChartItem from './TimelineChartItem';
import TimelineChartPopover from './TimelineChartPopover';

import './TimelineChart.scss';

const getStart = (zoomLevel: TimelineChartZoomLevel, earliestDate: Date) => {
  if (zoomLevel === 'days') {
    return startOfMonth(earliestDate);
  }

  return startOfYear(earliestDate);
};

const getEnd = (zoomLevel: TimelineChartZoomLevel, latestDate: Date) => {
  if (zoomLevel === 'days') {
    return endOfMonth(latestDate);
  }

  return endOfYear(latestDate);
};

const TimelineChart: FC<TimelineRendererProps> = ({
  items,
  selectedId,
  onSelect,
  onUnselect,
  zoomLevel,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverItem, setPopoverItem] = useState<TimelineItem | null>(null);

  const [itemRefs, keyboardProps] =
    useTimelineKeyboardNavigation<HTMLLIElement>(items, onUnselect);

  const earliestDate = items
    .map((item) => item.getEarliestDate())
    .filter((date): date is Date => date !== undefined)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const latestDate = items
    .map((item) => item.getLatestDate())
    .filter((date): date is Date => date !== undefined)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const start = getStart(zoomLevel, earliestDate);
  const end = getEnd(zoomLevel, latestDate);
  const days = differenceInDays(end, start) + 1;

  const style: CSSProperties = {
    ['--timeline-chart-days' as string]: days,
  };

  return (
    <div
      {...keyboardProps}
      className={c(
        'TimelineChart',
        `TimelineChart--${zoomLevel}`,
        Classes.FOCUS_STYLE_MANAGER_IGNORE
      )}
      style={style}
      onClick={() => onUnselect()}
    >
      <TimelineChartGrid start={start} end={end} zoomLevel={zoomLevel} />
      <TimelineChartLabels start={start} end={end} zoomLevel={zoomLevel} />

      {popoverItem && (
        <TimelineChartPopover
          open={showPopover && !selectedId}
          entity={popoverItem.entity}
        />
      )}

      <ul className="TimelineChart__list">
        {items.map((item, index) => (
          <TimelineChartItem
            key={item.entity.id}
            timelineStart={start}
            item={item}
            selected={selectedId === item.entity.id}
            muted={!!selectedId && selectedId !== item.entity.id}
            onSelect={(entity) => {
              onSelect(entity);
              setShowPopover(false);
            }}
            onMouseOver={() => {
              setShowPopover(true);
              setPopoverItem(item);
            }}
            onMouseOut={() => setShowPopover(false)}
            ref={itemRefs[index]}
          />
        ))}
      </ul>
    </div>
  );
};

export default TimelineChart;
