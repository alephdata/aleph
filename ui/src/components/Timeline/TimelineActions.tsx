import { FC } from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

import TimelineItemCreateButton from './TimelineItemCreateButton';
import { selectIsEmpty } from './state';
import { useTimelineContext } from './context';

import './TimelineActions.scss';

type TimelineActionsProps = {
  writeable?: boolean;
};

const TimelineActions: FC<TimelineActionsProps> = ({ writeable }) => {
  const [state, dispatch] = useTimelineContext();
  const isEmpty = selectIsEmpty(state);

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
      <ButtonGroup>
        <Button
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
