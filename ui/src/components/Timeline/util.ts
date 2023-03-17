import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
  createRef,
  KeyboardEvent,
  MutableRefObject,
  RefObject,
  RefCallback,
} from 'react';
import { differenceInDays } from 'date-fns';
import { throttle } from 'lodash';
import { Entity, Schema } from '@alephdata/followthemoney';
import { DEFAULT_COLOR } from './Timeline';
import { FetchEntitySuggestions, Layout, Vertex } from './types';

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
 * Returns the first scrollable parent element for the given element
 * or the element itself if it is scrollable.
 */
function getScrollParent(element: HTMLElement): HTMLElement {
  const style = window.getComputedStyle(element);
  const scrollable = ['scroll', 'auto'];

  if (
    (scrollable.includes(style.overflowX) &&
      element.scrollWidth > element.clientWidth) ||
    (scrollable.includes(style.overflowY) &&
      element.scrollHeight > element.clientHeight)
  ) {
    return element;
  }

  if (element.parentElement) {
    return getScrollParent(element.parentElement);
  }

  return document.documentElement;
}

/**
 * Checks whether the element is at least partially within the visible
 * part of the scroll parent.
 */
export function isScrolledIntoView(element: HTMLElement): boolean {
  const container = getScrollParent(element);
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  return (
    elementRect.left < containerRect.right &&
    elementRect.right > containerRect.left &&
    elementRect.top < containerRect.bottom &&
    elementRect.bottom > containerRect.top
  );
}

/**
 * Merges multiple refs, ensuring that all refs get updated whenever the
 * merged ref is updated.
 */
export function mergeRefs<T>(
  ...refs: Array<RefCallback<T> | MutableRefObject<T | null> | null>
): RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref !== null) {
        ref.current = value;
      }
    }
  };
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
 * FollowTheMoney allows dates with different degrees of precision, e.g. `2022`,
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

/**
 * Handles keyboard-related logic for a list of timeline items, for example
 * moving focus to the next/previous element when pressing arrow keys and
 * unselecting elements when pressing the escape key.
 */
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

/**
 * Handles keyboard-related logic for a single timeline item, for example
 * selecting the item when pressing enter.
 */
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

/**
 * Executes a side-effect whenever a timeline item is selected.
 */
export function useTimelineItemSelectedChange(
  selected: boolean | undefined,
  onSelected: () => void
) {
  const previouslySelected = useRef<boolean>(false);

  useEffect(() => {
    if (!selected) {
      previouslySelected.current = false;
      return;
    }

    // The timeline item was selected before, i.e. there has been no change
    if (previouslySelected.current) {
      return;
    }

    previouslySelected.current = true;
    onSelected();
  }, [selected, onSelected]);
}

/**
 * Provides an easy way to fetch entity suggestions in component (for
 * example when using entity auto-complete fields, handling request
 * throttling and state updates.
 */
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

/**
 * Exposes the native browser form validation state in a simple state variable.
 */
export function useFormValidity(formRef: RefObject<HTMLFormElement>) {
  const [isValid, setIsValid] = useState(false);

  const onInput = () => {
    setIsValid(!!formRef.current?.checkValidity());
  };

  return [isValid, onInput] as const;
}

/**
 * Return a new layout object, replacing or inserting the given vertex.
 */
export function updateVertex(layout: Layout, updatedVertex: Vertex): Layout {
  const { vertices } = layout;
  const index = layout.vertices.findIndex(
    (vertex) => vertex.entityId === updatedVertex.entityId
  );

  const newVertices = [...vertices];

  if (index < 0) {
    newVertices.push(updatedVertex);
  } else {
    newVertices.splice(index, 1, updatedVertex);
  }

  return { vertices: newVertices };
}
