import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Intent } from '@blueprintjs/core';

type TimelineItemCreateButtonProps = {
  onClick: Button['props']['onClick'];
};

const TimelineItemCreateButton: FC<TimelineItemCreateButtonProps> = ({
  onClick,
}) => (
  <Button intent={Intent.PRIMARY} icon="add" onClick={onClick}>
    <FormattedMessage
      id="timeline.actions.add_item"
      defaultMessage="Add item"
    />
  </Button>
);

export default TimelineItemCreateButton;
