import React, { PureComponent } from 'react';
import { Popover, Position, Tag, Intent, Callout } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import { Role } from 'components/common';

import './ProfileTag.scss';

const messages = defineMessages({
  explain: {
    id: 'profile.explain',
    defaultMessage: 'This is a profile showing aggregated entity information from multiple datasets.',
  }
});

class ProfileTag extends PureComponent {

  render() {
    const { intl, entitySet } = this.props;
    if (entitySet.type !== 'profile') {
      return null;
    }
    const content = (
      <Callout className="ProfileTag__message">
        {intl.formatMessage(messages.explain)}
      </Callout>
    )
    return (
      <Popover interactionKind="hover" position={Position.BOTTOM} content={content}>
        <Tag className="ProfileTag">
          <FormattedMessage id="profile.tag" defaultMessage="PROFILE" />
        </Tag>
      </Popover>
    );
  }
}

export default injectIntl(ProfileTag);
