import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { TimelineChartZoomLevel } from './types';

type TimelineZoomLevelSwitchProps = {
  zoomLevel: TimelineChartZoomLevel;
  availableZoomLevels: Array<TimelineChartZoomLevel>;
  disabled?: boolean;
  onSwitch: (zoomLevel: TimelineChartZoomLevel) => void;
};

const TimelineZoomLevelSwitch: FC<TimelineZoomLevelSwitchProps> = ({
  zoomLevel,
  availableZoomLevels,
  disabled,
  onSwitch,
}) => {
  return (
    <ButtonGroup>
      <Button
        disabled={disabled || !availableZoomLevels.includes('days')}
        active={zoomLevel === 'days'}
        onClick={() => onSwitch('days')}
      >
        <FormattedMessage
          id="timeline.actions.zoom_level.days"
          defaultMessage="Days"
        />
      </Button>
      <Button
        disabled={disabled || !availableZoomLevels.includes('months')}
        active={zoomLevel === 'months'}
        onClick={() => onSwitch('months')}
      >
        <FormattedMessage
          id="timeline.actions.zoom_level.months"
          defaultMessage="Months"
        />
      </Button>
      <Button
        disabled={disabled || !availableZoomLevels.includes('years')}
        active={zoomLevel === 'years'}
        onClick={() => onSwitch('years')}
      >
        <FormattedMessage
          id="timeline.actions.zoom_level.years"
          defaultMessage="Years"
        />
      </Button>
    </ButtonGroup>
  );
};

export default TimelineZoomLevelSwitch;
