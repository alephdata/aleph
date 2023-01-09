import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  createRef,
  KeyboardEvent,
} from 'react';
import { differenceInDays } from 'date-fns';
import { throttle } from 'lodash';
import { Entity, Schema } from '@alephdata/followthemoney';
import { DEFAULT_COLOR } from './Timeline';
import { FetchEntitySuggestions, Layout } from './types';

function endOfMonth(year: number, month: number): number {
  // Months in ECMAScript are zero-based:
  // new Date(2000, 0, 1) // Jan 1st
  //
  // Setting the day to zero will return the last day of the previous month:
  // new Date(2000, 1, 0) // Jan 31st
  // new Date(2000, 12, 0) // Dec 31st
  const date = new Date(year, month, 0);

  return date.getDate();
}

/**
 * This is a wrapper class for entities, providing common logic required when
 * rendering them as part of a timeline list or chart, for example calculating
 * the earliest or latest date, or getting the color from the layout definition
 * of the timeline.
 */
export class TimelineItem {
  readonly entity: Entity;
  readonly layout?: Layout;
  protected readonly startDate: ImpreciseDate;
  protected readonly endDate: ImpreciseDate;

  constructor(entity: Entity, layout?: Layout) {
    this.entity = entity;
    this.layout = layout;
    this.startDate = new ImpreciseDate(this.entity.getTemporalStart()?.value);
    this.endDate = new ImpreciseDate(this.entity.getTemporalEnd()?.value);
  }

  getColor() {
    if (!this.layout) {
      return DEFAULT_COLOR;
    }

    return (
      this.layout.vertices.find((vertex) => vertex.entityId === this.entity.id)
        ?.color || DEFAULT_COLOR
    );
  }

  getEarliestDate() {
    return this.startDate.getEarliest();
  }

  getLatestDate() {
    if (!this.endDate.isValid()) {
      return this.startDate.getLatest();
    }

    return this.endDate.getLatest();
  }

  getDuration() {
    const earliest = this.getEarliestDate();
    const latest = this.getLatestDate();

    if (!earliest || !latest) {
      return;
    }

    return differenceInDays(latest, earliest) + 1;
  }

  isSingleDay() {
    const duration = this.getDuration();

    if (!duration) {
      return false;
    }

    return duration === 1;
  }

  isMultiDay() {
    const duration = this.getDuration();

    if (!duration) {
      return false;
    }

    return duration > 1;
  }
}

/**
 * FollowTheMoney allows dates with different degress of precision, e.g. `2022`,
 * `2022-01`, and `2022-01-01` are all valid dates. This class parses FtM date strings
 * and provides utility methods to work with imprecise dates, e.g. to get the earliest
 * or latest possible date.
 */
export class ImpreciseDate {
  readonly year?: number;
  readonly month?: number;
  readonly day?: number;

  constructor(raw?: string) {
    if (!raw) {
      return;
    }

    const yearRegex = /(?<year>\d{4})/.source;
    const monthRegex = /(?<month>0?[1-9]|1[0-2])/.source;
    const dayRegex = /(?<day>0?[1-9]|[1-2][0-9]|3[0-1])/.source;

    const regex = new RegExp(
      `^${yearRegex}(?:-${monthRegex}(?:-${dayRegex})?)?$`
    );

    const result = regex.exec(raw);
    const groups = result?.groups;

    if (!groups) {
      return;
    }

    this.year = groups.year ? parseInt(groups.year, 10) : undefined;
    this.month = groups.month ? parseInt(groups.month, 10) : undefined;
    this.day = groups.day ? parseInt(groups.day, 10) : undefined;
  }

  isValid() {
    if (!this.year) {
      return false;
    }

    if (
      this.month &&
      this.day &&
      endOfMonth(this.year, this.month) < this.day
    ) {
      return false;
    }

    return true;
  }

  getEarliest() {
    if (!this.isValid() || !this.year) {
      return;
    }

    return new Date(this.year, this.month ? this.month - 1 : 0, this.day || 1);
  }

  getLatest() {
    if (!this.isValid() || !this.year) {
      return;
    }

    const month = this.month || 12;
    const day = this.day || endOfMonth(this.year, month);

    return new Date(this.year, month - 1, day);
  }
}

export function useTimelineKeyboardNavigation<T extends HTMLElement>(
  items: Array<TimelineItem>,
  onUnselect: () => void
) {
  const itemRefs = useMemo(() => items.map(() => createRef<T>()), [items]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      onUnselect();
      return;
    }

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
  };

  return [itemRefs, { onKeyDown }] as const;
}

export function useTimelineItemKeyboardNavigation(
  entity: Entity,
  onSelect: (entity: Entity) => void
) {
  const onKeyUp = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      onSelect(entity);
    }
  };

  return { onKeyUp } as const;
}

export function useEntitySuggestions(
  schema: Schema,
  fetchSuggestions: FetchEntitySuggestions
) {
  const [suggestions, setSuggestions] = useState<Array<Entity>>([]);
  const [isFetching, setIsFetching] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onQueryChange = useCallback(
    throttle(
      async (query: string) => {
        setIsFetching(true);

        try {
          const entities = await fetchSuggestions(schema, query);
          setSuggestions(entities);
        } finally {
          setIsFetching(false);
        }
      },
      200,
      { leading: false, trailing: true }
    ),
    [throttle, schema, fetchSuggestions]
  );

  useEffect(() => {
    // Fetch suggestions on mount
    onQueryChange('');

    // Cancel any outstanding fetches before unmounting
    return () => onQueryChange.cancel();
  }, [onQueryChange]);

  return [suggestions, isFetching, onQueryChange] as const;
}
