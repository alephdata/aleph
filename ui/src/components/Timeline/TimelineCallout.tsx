import { FC } from 'react';
import { Callout, Icon, Intent } from '@blueprintjs/core';

import './TimelineCallout.scss';

const TimelineCallout: FC = ({ children }) => (
  <Callout className="TimelineCallout" intent={Intent.WARNING} icon={null}>
    <Icon icon="warning-sign" />
    <div className="TimelineCallout__text">{children}</div>
  </Callout>
);

export default TimelineCallout;
