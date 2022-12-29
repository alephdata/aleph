import { FC, KeyboardEvent, useMemo, createRef } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import TimelineListItem from './TimelineListItem';
import type { TimelineRendererProps } from './types';

import './TimelineList.scss';

const TimelineList: FC<TimelineRendererProps> = ({
  items,
  onSelect,
  onRemove,
  onUnselect,
  selectedId,
}) => {
  const showEndDate = items.some((item) => item.entity.getTemporalEnd());

  const itemRefs = useMemo(
    () => items.map(() => createRef<HTMLTableRowElement>()),
    [items]
  );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const activeIndex = itemRefs.findIndex(
      (ref) =>
        ref.current === document.activeElement ||
        ref.current?.contains(document.activeElement)
    );

    if (activeIndex < 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      const newIndex = Math.min(items.length - 1, activeIndex + 1);
      itemRefs[newIndex].current?.focus();
    }

    if (event.key === 'ArrowUp') {
      const newIndex = Math.max(0, activeIndex - 1);
      itemRefs[newIndex].current?.focus();
    }

    if (event.key === 'Escape') {
      onUnselect();
    }
  };

  return (
    <table
      className={c('TimelineList', Classes.FOCUS_STYLE_MANAGER_IGNORE)}
      onKeyDown={onKeyDown}
    >
      <thead>
        <tr className="TimelineList__header">
          {showEndDate ? (
            <>
              <th>Start date</th>
              <th>End date</th>
            </>
          ) : (
            <th>Date</th>
          )}
          <th>Caption</th>
          <th>
            <span className="visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <TimelineListItem
            key={item.entity.id}
            entity={item.entity}
            muted={!!selectedId && item.entity.id !== selectedId}
            selected={item.entity.id === selectedId}
            color={item.getColor()}
            showEndDate={showEndDate}
            onSelect={onSelect}
            onRemove={onRemove}
            ref={itemRefs[index]}
          />
        ))}
      </tbody>
    </table>
  );
};

export default TimelineList;
