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
      <Callout onClick={this.onSignIn} className={`${className} clickable pt-icon-info-sign pt-intent-primary`}>
        <h4 className="pt-callout-title">
          <FormattedMessage
            id="search.callout_heading"
            defaultMessage="Some sources are hidden from anonymous users"
            />
        </h4>
        <FormattedMessage
          id="search.callout_message"
          defaultMessage="Sign in to see all results you’re authorised to access."
          />
      </Callout>
    )
  }
}

export default injectIntl(CalloutBox);
