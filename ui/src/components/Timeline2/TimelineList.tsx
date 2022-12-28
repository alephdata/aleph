import { FC } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import TimelineListItem from './TimelineListItem';
import { useTimelineKeyboardNavigation } from './util';
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
  const [itemRefs, keyboardProps] =
    useTimelineKeyboardNavigation<HTMLTableRowElement>(items, onUnselect);

  return (
    <table
      {...keyboardProps}
      className={c('TimelineList', Classes.FOCUS_STYLE_MANAGER_IGNORE)}
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
