import { FC } from 'react';
import { NonIdealState, NonIdealStateProps } from '@blueprintjs/core';

type TimelineEmptyStateProps = {
  action?: NonIdealStateProps['action'];
};

const TimelineEmptyState: FC<TimelineEmptyStateProps> = ({ action }) => (
  <NonIdealState
    icon="gantt-chart"
    title="This timeline is still empty"
    description={action && 'Add an item to get started.'}
    action={action}
  />
);

export default TimelineEmptyState;
