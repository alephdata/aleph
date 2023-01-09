import { FC, KeyboardEvent, useMemo, createRef } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import { Entity } from '@alephdata/followthemoney';
import { DEFAULT_COLOR } from './Timeline';
import TimelineListItem from './TimelineListItem';
import { type TimelineRendererProps } from './Timeline';

import './TimelineList.scss';

const getColor = (
  layout: TimelineRendererProps['layout'],
  entity: Entity
): string => {
  return (
    layout.vertices.find((vertex) => vertex.entityId === entity.id)?.color ||
    DEFAULT_COLOR
  );
};

const TimelineList: FC<TimelineRendererProps> = ({
  entities,
  layout,
  onSelect,
  onRemove,
  selectedId,
}) => {
  const itemRefs = useMemo(
    () => entities.map(() => createRef<HTMLDivElement>()),
    [entities]
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
      const newIndex = Math.min(entities.length - 1, activeIndex + 1);
      itemRefs[newIndex].current?.focus();
    }

    if (event.key === 'ArrowUp') {
      const newIndex = Math.max(0, activeIndex - 1);
      itemRefs[newIndex].current?.focus();
    }
  };

  return (
    <ul
      className={c('TimelineList', Classes.FOCUS_STYLE_MANAGER_IGNORE)}
      onKeyDown={onKeyDown}
    >
      {entities.map((entity, index) => (
        <li key={entity.id}>
          <TimelineListItem
            entity={entity}
            muted={!!selectedId && entity.id !== selectedId}
            selected={entity.id === selectedId}
            color={getColor(layout, entity)}
            onSelect={onSelect}
            onRemove={onRemove}
            ref={itemRefs[index]}
          />
        </li>
      ))}
    </ul>
  );
};

export default TimelineList;
