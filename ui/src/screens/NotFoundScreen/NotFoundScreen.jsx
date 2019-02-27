import React, { Component } from 'react';
import { injectIntl, defineMessages } from 'react-intl';

import ErrorScreen from 'src/components/Screen/ErrorScreen';


const messages = defineMessages({
  not_found: {
    id: 'error.screen.not_found',
    defaultMessage: 'The requested page could not be found.',
  },
});


@injectIntl
export class NotFoundScreen extends Component {
  render() {
    const { intl } = this.props;
    return <ErrorScreen title={intl.formatMessage(messages.not_found)} />;
  }
}
