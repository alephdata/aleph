import { FC } from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { FormattedMessage, useIntl } from 'react-intl';

import TimelineItemCreateButton from './TimelineItemCreateButton';
import TimelineZoomLevelSwitch from './TimelineZoomLevelSwitch';
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
    </div>
  );
};

export default TimelineActions;
