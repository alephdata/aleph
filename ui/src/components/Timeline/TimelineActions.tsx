import { FC } from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

import TimelineItemCreateButton from './TimelineItemCreateButton';
import { TimelineChartZoomLevel } from './types';

import './TimelineActions.scss';

type TimelineActionsProps = {
  zoomLevel: TimelineChartZoomLevel;
  onZoomLevelChange: (zoomLevel: TimelineChartZoomLevel) => void;
  onCreateDialogToggle: () => void;
};

const TimelineActions: FC<TimelineActionsProps> = ({
  zoomLevel,
  onZoomLevelChange,
  onCreateDialogToggle,
}) => {
  return (
    <div className="TimelineActions">
      <TimelineItemCreateButton onClick={onCreateDialogToggle} />
      <ButtonGroup>
        <Button
          active={zoomLevel === 'days'}
          onClick={() => onZoomLevelChange('days')}
        >
          <FormattedMessage
            id="timeline.actions.zoom_level.days"
            defaultMessage="Days"
          />
        </Button>
        <Button
          active={zoomLevel === 'months'}
          onClick={() => onZoomLevelChange('months')}
        >
          <FormattedMessage
            id="timeline.actions.zoom_level.months"
            defaultMessage="Months"
          />
        </Button>
        <Button
          active={zoomLevel === 'years'}
          onClick={() => onZoomLevelChange('years')}
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
