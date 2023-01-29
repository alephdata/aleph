import { FC } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import TimelineListItem from './TimelineListItem';
import { useTimelineKeyboardNavigation } from '../util';
import type { TimelineRendererProps } from '../types';

import './TimelineList.scss';
import { FormattedMessage } from 'react-intl';

const TimelineList: FC<TimelineRendererProps> = ({
  items,
  writeable,
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
              <th>
                <FormattedMessage
                  id="timeline.item.start_date"
                  defaultMessage="Start date"
                />
              </th>
              <th>
                <FormattedMessage
                  id="timeline.item.end_date"
                  defaultMessage="End date"
                />
              </th>
            </>
          ) : (
            <th>
              <FormattedMessage id="timeline.item.date" defaultMessage="Date" />
            </th>
          )}
          <th>
            <FormattedMessage
              id="timeline.item.caption"
              defaultMessage="Caption"
            />
          </th>
          {writeable && (
            <th>
              <span className="visually-hidden">
                <FormattedMessage
                  id="timeline.item.actions"
                  defaultMessage="Actions"
                />
              </span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <TimelineListItem
            key={item.entity.id}
            entity={item.entity}
            writeable={writeable}
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
