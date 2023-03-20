import { FC, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { TimelineChartZoomLevel } from './types';
import {
  DAYS_ZOOM_LEVEL_MAX_YEARS,
  MONTHS_ZOOM_LEVEL_MAX_YEARS,
} from './state';

import './TimelineZoomLevelSwitch.scss';

type TimelineZoomLevelSwitchProps = {
  zoomLevel: TimelineChartZoomLevel;
  availableZoomLevels: Array<TimelineChartZoomLevel>;
  disabled?: boolean;
  onSwitch: (zoomLevel: TimelineChartZoomLevel) => void;
};

const UnavailableTooltip: FC<{
  label: ReactNode;
  maxYears: number;
  disabled: boolean;
}> = ({ label, maxYears, disabled, children }) => (
  <Tooltip
    popoverClassName="TimelineZoomLevelSwitch__tooltip"
    placement="bottom"
    disabled={disabled}
    content={
      <FormattedMessage
        id="timeline.zoom_levels.unavailable"
        defaultMessage="The “{label}” view is not available because this timeline covers a period of {maxYears} years or more."
        values={{ label, maxYears }}
      />
    }
  >
    {children}
  </Tooltip>
);

const TimelineZoomLevelSwitch: FC<TimelineZoomLevelSwitchProps> = ({
  zoomLevel,
  availableZoomLevels,
  disabled,
  onSwitch,
}) => {
  const daysLabel = (
    <FormattedMessage id="timeline.zoom_levels.days" defaultMessage="Days" />
  );

  const monthsLabel = (
    <FormattedMessage
      id="timeline.zoom_levels.months"
      defaultMessage="Months"
    />
  );

  const yearsLabel = (
    <FormattedMessage id="timeline.zoom_levels.years" defaultMessage="Years" />
  );

  return (
    <ButtonGroup>
      <UnavailableTooltip
        maxYears={DAYS_ZOOM_LEVEL_MAX_YEARS}
        label={daysLabel}
        disabled={disabled || availableZoomLevels.includes('days')}
      >
        <Button
          disabled={disabled || !availableZoomLevels.includes('days')}
          active={zoomLevel === 'days'}
          onClick={() => onSwitch('days')}
        >
          {daysLabel}
        </Button>
      </UnavailableTooltip>
      <UnavailableTooltip
        maxYears={MONTHS_ZOOM_LEVEL_MAX_YEARS}
        label={yearsLabel}
        disabled={disabled || availableZoomLevels.includes('months')}
      >
        <Button
          disabled={disabled || !availableZoomLevels.includes('months')}
          active={zoomLevel === 'months'}
          onClick={() => onSwitch('months')}
        >
          {monthsLabel}
        </Button>
      </UnavailableTooltip>
      <Button
        disabled={disabled || !availableZoomLevels.includes('years')}
        active={zoomLevel === 'years'}
        onClick={() => onSwitch('years')}
      >
        {yearsLabel}
      </Button>
    </ButtonGroup>
  );
};

export default TimelineZoomLevelSwitch;
