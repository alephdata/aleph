import React, { PureComponent } from 'react';
import { Popover, Position, Tag, Intent, Callout } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import './Restricted.scss';

const messages = defineMessages({
  explain: {
    id: 'restricted.explain',
    defaultMessage: 'Use of this dataset is restricted. Read the description and contact the dataset manager before using this material.',
  },
});

class Restricted extends PureComponent {

  render() {
    const { intl, collection } = this.props;
    if (!collection.restricted) {
        return null;
    }

    const content = (
      <Callout intent={Intent.WARNING} className="Restricted__message">
        {intl.formatMessage(messages.explain)}
      </Callout>
    )

    return (
      <Popover interactionKind="hover" position={Position.BOTTOM} content={content}>
        <Tag intent={Intent.WARNING} icon="warning-sign" className="Restricted">
          <FormattedMessage id="restricted.tag" defaultMessage="RESTRICTED" />
        </Tag>
      </Popover>
    );
  }
}

export default injectIntl(Restricted);
