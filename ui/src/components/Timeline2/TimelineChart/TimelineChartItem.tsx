import { CSSProperties, forwardRef } from 'react';
import c from 'classnames';
import { differenceInDays, addDays } from 'date-fns';
import { Entity } from '@alephdata/followthemoney';
import { useTimelineItemKeyboardNavigation, TimelineItem } from '../util';
import TimelineItemCaption from '../TimelineItemCaption';

import './TimelineChartItem.scss';

type TimelineChartItemProps = {
  timelineStart: Date;
  item: TimelineItem;
  muted?: boolean;
  selected?: boolean;
  onSelect: (entity: Entity) => void;
};

const TimelineChartItem = forwardRef<HTMLLIElement, TimelineChartItemProps>(
  (props, ref) => {
    const { timelineStart, item, muted, selected, onSelect } = props;
    const start = item.getEarliestDate();
    const end = item.getLatestDate();
    const keyboardProps = useTimelineItemKeyboardNavigation(
      item.entity,
      onSelect
    );

    if (!start || !end) {
      return null;
    }

    const style: CSSProperties = {
      ['--timeline-item-color' as string]: item.getColor(),
      ['--timeline-chart-item-start-day' as string]: differenceInDays(
        start,
        timelineStart
      ),
      ['--timeline-chart-item-end-day' as string]: differenceInDays(
        addDays(end, 1),
        timelineStart
      ),
    };

    return (
      <li
        {...keyboardProps}
        tabIndex={0}
        className={c(
          'TimelineChartItem',
          item.isSingleDay() && 'TimelineChartItem--singleDay',
          item.isMultiDay() && 'TimelineChartItem--multiDay',
          muted && 'TimelineChartItem--muted',
          selected && 'TimelineChartItem--selected'
        )}
        style={style}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(item.entity);
        }}
        ref={ref}
      >
        <div className="TimelineChartItem__caption">
          <TimelineItemCaption entity={item.entity} />
        </div>
      </li>
    );
  }
);

export default TimelineChartItem;
