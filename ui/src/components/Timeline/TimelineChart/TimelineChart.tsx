import { FC, CSSProperties, useState } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import { differenceInDays } from 'date-fns';
import { useTimelineKeyboardNavigation } from '../util';
import type { TimelineRendererProps } from '../types';
import { TimelineItem } from '../util';
import { getStart, getEnd } from './util';
import TimelineChartGrid from './TimelineChartGrid';
import TimelineChartLabels from './TimelineChartLabels';
import TimelineChartItem from './TimelineChartItem';
import TimelineChartPopover from './TimelineChartPopover';

import './TimelineChart.scss';

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

  const start = getStart(zoomLevel, earliestDate, latestDate);
  const end = getEnd(zoomLevel, earliestDate, latestDate);
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
      <TimelineChartLabels start={start} end={end} zoomLevel={zoomLevel} />
      <TimelineChartGrid start={start} end={end} zoomLevel={zoomLevel} />

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
