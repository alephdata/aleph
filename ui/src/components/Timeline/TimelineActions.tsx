import { FC } from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { FormattedMessage, useIntl } from 'react-intl';

import TimelineItemCreateButton from './TimelineItemCreateButton';
import TimelineZoomLevelSwitch from './TimelineZoomLevelSwitch';
import { FeedbackButton } from 'components/common';
import {
  selectIsEmpty,
  selectIsZoomEnabled,
  selectAvailableZoomLevels,
  selectZoomLevel,
} from './state';
import { useTimelineContext } from './context';

import './TimelineActions.scss';

type TimelineActionsProps = {
  writeable?: boolean;
};

const TimelineActions: FC<TimelineActionsProps> = ({ writeable }) => {
  const intl = useIntl();
  const [state, dispatch] = useTimelineContext();
  const isZoomDisabled = !selectIsZoomEnabled(state);
  const availableZoomLevels = selectAvailableZoomLevels(state);
  const zoomLevel = selectZoomLevel(state);

  if (selectIsEmpty(state)) {
    return null;
  }

  return (
    <div className="TimelineActions">
      {writeable && (
        <TimelineItemCreateButton
          onClick={() => dispatch({ type: 'TOGGLE_CREATE_DIALOG' })}
        />
      )}
      <ButtonGroup
        role="group"
        aria-label={intl.formatMessage({
          id: 'timeline.actions.renderer.label',
          defaultMessage: 'Change view',
        })}
      >
        <Button
          icon="list"
          active={state.renderer === 'list'}
          aria-pressed={state.renderer === 'list'}
          onClick={() =>
            dispatch({ type: 'SET_RENDERER', payload: { renderer: 'list' } })
          }
        >
          <FormattedMessage id="timeline.renderer.list" defaultMessage="List" />
        </Button>
        <Button
          icon="gantt-chart"
          active={state.renderer === 'chart'}
          aria-pressed={state.renderer === 'chart'}
          onClick={() =>
            dispatch({ type: 'SET_RENDERER', payload: { renderer: 'chart' } })
          }
        >
          <FormattedMessage
            id="timeline.renderer.chart"
            defaultMessage="Chart"
          />
        </Button>
      </ButtonGroup>
      <TimelineZoomLevelSwitch
        zoomLevel={zoomLevel}
        availableZoomLevels={availableZoomLevels}
        disabled={isZoomDisabled}
        onSwitch={(zoomLevel) =>
          dispatch({
            type: 'SET_ZOOM_LEVEL',
            payload: { zoomLevel },
          })
        }
      />
      {
        // The `FeedbackButton` component relies on a Redux store being provided
        // in a context. Apart from the feedback button, the entire timeliens feature
        // is independent from the Redux app store, so instead of setting up a test
        // environment that mocks the store, we resort to this hacky workaround and
        // simply do not render the feedback button in tests. This is fine because
        // the feedback button is not critical.
        process.env.NODE_ENV !== 'test' && (
          <FeedbackButton type="timelines" minimal>
            <span className="TimelineActions__feedback">Give feedback</span>
          </FeedbackButton>
        )
      }
    </div>
  );
};

export default TimelineActions;
