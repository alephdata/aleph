import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Callout } from '@blueprintjs/core';

class CalloutBox extends React.Component {
  constructor(props) {
    super(props);
    this.onSignIn = this.onSignIn.bind(this);
  }

  onSignIn() {
    this.props.onClick();
  }

  render() {
    const { className } = this.props;

    return (
      <Callout onClick={this.onSignIn} className={`${className} clickable pt-icon-info-sign pt-intent-warning`}>
        <FormattedMessage
          id="search.callout_message"
          defaultMessage="Some sources are hidden from anonymous users. Please sign in to see all results you’re authorised to access!"
          />
      </Callout>
    )
  }
}

export default injectIntl(CalloutBox);
