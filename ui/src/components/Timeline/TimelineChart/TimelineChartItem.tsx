import { CSSProperties, forwardRef, MouseEventHandler, useRef } from 'react';
import c from 'classnames';
import { differenceInDays, addDays } from 'date-fns';
import { Entity } from '@alephdata/followthemoney';
import {
  isScrolledIntoView,
  useTimelineItemKeyboardNavigation,
  useTimelineItemSelectedChange,
  TimelineItem,
  mergeRefs,
} from '../util';
import TimelineItemCaption from '../TimelineItemCaption';

import './TimelineChartItem.scss';

type TimelineChartItemProps = {
  timelineStart: Date;
  item: TimelineItem;
  muted?: boolean;
  selected?: boolean;
  onSelect: (entity: Entity) => void;
  onMouseOver?: MouseEventHandler;
  onMouseOut?: MouseEventHandler;
};

const TimelineChartItem = forwardRef<HTMLLIElement, TimelineChartItemProps>(
  (props, forwardedRef) => {
    const {
      timelineStart,
      item,
      muted,
      selected,
      onSelect,
      onMouseOver,
      onMouseOut,
    } = props;
    const start = item.getEarliestDate();
    const end = item.getLatestDate();

    const keyboardProps = useTimelineItemKeyboardNavigation(
      item.entity,
      onSelect
    );

    const elementRef = useRef<HTMLLIElement>();
    useTimelineItemSelectedChange(selected, () => {
      if (!elementRef.current) {
        return;
      }

      // Focus the item if it has been selected and hasn't already received keyboard.
      // This is necessary for example for newly created items.
      elementRef.current.focus({ preventScroll: true });

      // Scroll the item into view if it wouldn't be visible (at least partially).
      // This can be necessary if the entity viewer sidebar would otherwise overlap
      // the selected element or for newly created items.
      if (!isScrolledIntoView(elementRef.current)) {
        elementRef.current.scrollIntoView({
          inline: 'center',
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    });

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
        ref={mergeRefs(forwardedRef, elementRef)}
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
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      >
        <div className="TimelineChartItem__caption">
          <TimelineItemCaption entity={item.entity} />
        </div>
      </li>
    );
  }
);

export default TimelineChartItem;
