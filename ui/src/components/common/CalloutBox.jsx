import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Callout } from '@blueprintjs/core';

class CalloutBox extends React.Component {

  constructor(props) {
    super(props);
  }

  onSignIn() {

  }

  render() {
    const { className } = this.props;

    return (
      <Callout className={`${className} pt-icon-info-sign pt-intent-warning`}>
        <FormattedMessage
          id="search.callout_first_part_description"
          defaultMessage="Some sources are hidden from anonymous users, please " />
        <a onClick={this.onSignIn}>
          <FormattedMessage id="search.callout_second_part_description" defaultMessage="sign in to see all results you’re authorised to access." />
        </a>
      </Callout>
    )
  }
}

export default injectIntl(CalloutBox);
