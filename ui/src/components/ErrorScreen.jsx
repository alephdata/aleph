import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { NonIdealState } from '@blueprintjs/core';

const messages = defineMessages({
  no_route_error: {
    id: 'errorscreen.no_route_error',
    defaultMessage: 'No such page: {path}',
  },
});

const ErrorScreen = ({ location, intl }) => (
  <NonIdealState
    visual="error"
    title={intl.formatMessage(messages.no_route_error, { path: location.pathname })}
  />
);

export default injectIntl(ErrorScreen);
