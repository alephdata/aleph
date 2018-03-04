import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { NonIdealState } from '@blueprintjs/core';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';

const messages = defineMessages({
  no_route_error: {
    id: 'errorscreen.no_route_error',
    defaultMessage: 'Page not found',
  },
});

const ErrorScreen = ({ location, intl }) => (
  <Screen>
    <DualPane>
      <DualPane.ContentPane>
        <NonIdealState
          visual="error"
          title={intl.formatMessage(messages.no_route_error)}
        />
      </DualPane.ContentPane>
    </DualPane>
  </Screen>
);

export default injectIntl(ErrorScreen);
