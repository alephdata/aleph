import { FC, HTMLProps, useEffect, useState, useRef } from 'react';
import { Popover2, Popover2TargetProps } from '@blueprintjs/popover2';
import { Entity } from '@alephdata/followthemoney';
import TimelineItemCaption from '../TimelineItemCaption';

import './TimelineChartPopover.scss';

type TimelineChartPopoverProps = {
  entity: Entity;
  open?: boolean;
};

const CLOSE_DELAY = 150;
const BOUNDARY_PADDING = 10;

function usePopoverState(delay: number) {
  const [showPopover, setShowPopover] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const cancelTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const setPopoverState = (open: boolean) => {
    if (open) {
      cancelTimeout();

      if (!showPopover) {
        setShowPopover(true);
      }
    } else {
      // Hide the popup with a small delay
      if (!timeoutRef.current && showPopover) {
        timeoutRef.current = window.setTimeout(() => {
          setShowPopover(false);
          cancelTimeout();
        }, delay);
      }
    }
  };

  return [showPopover, setPopoverState] as const;
}

function useMousePosition(callback?: CallableFunction) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      // Prevent async state updates in test environment
      if (process.env.NODE_ENV === 'test') {
        return;
      }

      setPosition({ x: event.clientX, y: event.clientY });
      callback && callback();
    };

    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [callback, setPosition]);

  return position;
}

const TimelineChartPopover: FC<TimelineChartPopoverProps> = ({
  entity,
  open,
}) => {
  // Because chart items can be very wide, the UX is slightly confusing when displaying
  // the popover at a fixed position. However, Blueprint's popover component doesn't support
  // positioning the popover relative to the mouse cursor position. We're working around
  // this using an invisible div rendered at the cursor position as the target element.
  const popoverRef = useRef<Popover2<HTMLProps<HTMLDivElement>> | null>(null);
  const position = useMousePosition(() => popoverRef.current?.reposition());

  const renderTarget = ({ isOpen, ...props }: Popover2TargetProps) => {
    return (
      <div
        {...props}
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          width: 0,
          height: 0,
        }}
      />
    );
  };

  // This delays closing the popover. If we didn't do this, moving from one timeline
  // item to another would close the popover, just to reopen it immediately. Especially d
  // due to the opening/closing animation, this would lead to a weird UX. Instead, we
  // do not close and reopen the popover in this case, we just change the contents.
  const [isOpen, setPopoverState] = usePopoverState(CLOSE_DELAY);
  useEffect(() => setPopoverState(!!open), [open, setPopoverState]);

  const temporalStart = entity.getTemporalStart();
  const temporalEnd = entity.getTemporalEnd();

  const content = (
    <div className="TimelineChartPopover__content">
      <strong className="TimelineChartPopover__caption">
        <TimelineItemCaption entity={entity} />
      </strong>

      {temporalStart && (
        <div className="TimelineChartPopover__date">
          {temporalStart.value}
          <br />
          <span className="TimelineChartPopover__property">
            {temporalStart.property.label}
          </span>
        </div>
      )}

      {temporalEnd && (
        <div className="TimelineChartPopover__date TimelineChartPopover__end">
          {temporalEnd.value}
          <br />
          <span className="TimelineChartPopover__property">
            {temporalEnd.property.label}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Popover2
      className="TimelineChartPopover"
      isOpen={isOpen}
      content={content}
      renderTarget={renderTarget}
      ref={popoverRef}
      position="top"
      modifiers={{
        preventOverflow: {
          options: {
            padding: BOUNDARY_PADDING,
          },
        },
      }}
    />
  );
};

export default TimelineChartPopover;
