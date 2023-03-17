import { FC } from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { FormattedMessage, useIntl } from 'react-intl';

import TimelineItemCreateButton from './TimelineItemCreateButton';
import { selectIsEmpty } from './state';
import { useTimelineContext } from './context';

import './TimelineActions.scss';

type TimelineActionsProps = {
  writeable?: boolean;
};

const TimelineActions: FC<TimelineActionsProps> = ({ writeable }) => {
  const intl = useIntl();
  const [state, dispatch] = useTimelineContext();
  const isEmpty = selectIsEmpty(state);
  const zoomLevelDisabled = state.renderer !== 'chart';

  if (isEmpty) {
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
      <ButtonGroup>
        <Button
          disabled={zoomLevelDisabled}
          active={state.zoomLevel === 'days'}
          onClick={() =>
            dispatch({ type: 'SET_ZOOM_LEVEL', payload: { zoomLevel: 'days' } })
          }
        >
          <FormattedMessage
            id="timeline.actions.zoom_level.days"
            defaultMessage="Days"
          />
        </Button>
        <Button
          disabled={zoomLevelDisabled}
          active={state.zoomLevel === 'months'}
          onClick={() =>
            dispatch({
              type: 'SET_ZOOM_LEVEL',
              payload: { zoomLevel: 'months' },
            })
          }
        >
          <FormattedMessage
            id="timeline.actions.zoom_level.months"
            defaultMessage="Months"
          />
        </Button>
        <Button
          disabled={zoomLevelDisabled}
          active={state.zoomLevel === 'years'}
          onClick={() =>
            dispatch({
              type: 'SET_ZOOM_LEVEL',
              payload: { zoomLevel: 'years' },
            })
          }
        >
          <FormattedMessage
            id="timeline.actions.zoom_level.years"
            defaultMessage="Years"
          />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default TimelineActions;
