import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { NonIdealState, NonIdealStateProps } from '@blueprintjs/core';

type TimelineEmptyStateProps = {
  action?: NonIdealStateProps['action'];
};

const TimelineEmptyState: FC<TimelineEmptyStateProps> = ({ action }) => (
  <NonIdealState
    icon="gantt-chart"
    action={action}
    title={
      <FormattedMessage
        id="timeline.empty_state.title"
        defaultMessage="This timeline is still empty"
      />
    }
    description={
      action && (
        <FormattedMessage
          id="timeline.empty_state.message"
          defaultMessage="Add an item to get started."
        />
      )
    }
  />
);

export default TimelineEmptyState;
