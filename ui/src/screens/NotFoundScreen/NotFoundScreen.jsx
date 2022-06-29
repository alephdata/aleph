{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { PureComponent } from 'react';
import { injectIntl, defineMessages } from 'react-intl';

import ErrorScreen from 'components/Screen/ErrorScreen';


const messages = defineMessages({
  not_found: {
    id: 'error.screen.not_found',
    defaultMessage: 'The requested page could not be found.',
  },
});


export class NotFoundScreen extends PureComponent {
  render() {
    const { intl } = this.props;
    return <ErrorScreen title={intl.formatMessage(messages.not_found)} />;
  }
}
export default injectIntl(NotFoundScreen);
