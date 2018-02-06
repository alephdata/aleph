import React from 'react';
import { injectIntl } from 'react-intl';
import { NonIdealState } from '@blueprintjs/core';

import messages from 'src/content/messages';

const ErrorScreen = ({ location, intl }) => (
  <NonIdealState
    visual="error"
    title={intl.formatMessage(messages.status.no_route_error, { path: location.pathname })}
  />
);

export default injectIntl(ErrorScreen);
