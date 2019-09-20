import React, { PureComponent } from 'react';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Callout } from '@blueprintjs/core';

import './WelcomeMessage.scss';

const messages = defineMessages({
  welcome: {
    id: 'welcomeMessge',
    defaultMessage: 'Welcome back {name}!',
  },
});

class WelcomeMessage extends PureComponent {
  render() {
    const { intl, name } = this.props;
    return (
      <div className="WelcomeMessage">
        <Callout className="bp3-intent-primary">
          <h4 className="bp3-heading">{intl.formatMessage(messages.welcome, { name })}</h4>
        </Callout>
      </div>
    );
  }
}

export default compose(
  injectIntl,
)(WelcomeMessage);
