import { CSSProperties, forwardRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Icon, IconSize } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import c from 'classnames';
import { Entity } from '@alephdata/followthemoney';
import { useTimelineItemKeyboardNavigation } from '../util';
import TimelineItemCaption from '../TimelineItemCaption';
import { reduceTranslucentColor } from 'util/reduceTranslucentColor';

import './TimelineListItem.scss';

type TimelineListItemProps = {
  entity: Entity;
  color: string;
  writeable?: boolean;
  selected?: boolean;
  muted?: boolean;
  showEndDate?: boolean;
  onSelect: (entity: Entity) => void;
  onRemove: (entity: Entity) => void;
};

const TimelineListItem = forwardRef<HTMLTableRowElement, TimelineListItemProps>(
  (props, ref) => {
    const {
      entity,
      color,
      writeable,
      selected,
      muted,
      showEndDate = false,
      onSelect,
      onRemove,
    } = props;

    const backgroundColor = reduceTranslucentColor(color, 0.1);
    const activeColor = reduceTranslucentColor(color, 0.15);
    const focusColor = reduceTranslucentColor(color, 0.2);

    const style: CSSProperties = {
      ['--timeline-item-color' as string]: color,
      ['--timeline-item-color-bg' as string]: backgroundColor,
      ['--timeline-item-color-bg-active' as string]: activeColor,
      ['--timeline-item-color-bg-focus' as string]: focusColor,
    };

    const keyboardProps = useTimelineItemKeyboardNavigation(entity, onSelect);

    const start = entity.getTemporalStart();
    const end = entity.getTemporalEnd();

    return (
      <tr
        {...keyboardProps}
        ref={ref}
        tabIndex={0}
        onClick={() => onSelect(entity)}
        style={style}
        className={c(
          'TimelineListItem',
          muted && 'TimelineListItem--muted',
          selected && 'TimelineListItem--selected'
        )}
      >
        <td className="TimelineListItem__date">
          {start ? (
            <>
              {start.value}
              <br />
              <span className="TimelineListItem__property">
                {start?.property.label}
              </span>
            </>
          ) : (
            <div className="TimelineListItem__warning">
              <Icon icon="warning-sign" color="white" />
              <FormattedMessage
                id="timeline.item.invalid_date"
                defaultMessage="Invalid or no date"
              />
            </div>
          )}
        </td>
        {showEndDate && (
          <td className="TimelineListItem__date">
            {end?.value}
            <br />
            <span className="TimelineListItem__property">
              {end?.property.label}
            </span>
          </td>
        )}
        <td className="TimelineListItem__caption">
          <strong>
            <TimelineItemCaption entity={entity} />
          </strong>
        </td>
        {writeable && (
          <td className="TimelineListItem__actions">
            <Tooltip
              placement="top"
              content={
                <FormattedMessage
                  id="timeline.item.remove.long"
                  defaultMessage="Remove from timeline"
                />
              }
            >
              <Button minimal small onClick={() => onRemove(entity)}>
                <Icon icon="trash" size={IconSize.STANDARD} />
                <span className="visually-hidden">
                  <FormattedMessage
                    id="timeline.item.remove.short"
                    defaultMessage="Remove"
                  />
                </span>
              </Button>
            </Tooltip>
          </td>
        )}
      </tr>
    );
  }
);

export default TimelineListItem;
