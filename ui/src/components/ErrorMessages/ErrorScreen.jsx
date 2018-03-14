import React, {Component} from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { NonIdealState } from '@blueprintjs/core';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';

import 'ErrorScreen.css';

const messages = defineMessages({
  no_route_error: {
    id: 'errorscreen.no_route_error',
    defaultMessage: 'Page not found',
  },
});

class EmptyList extends Component {
  render() {
    const {title, intl} = this.props;

    return (
      <div className='outer-div'>
        <div className='inner-div'>
          <NonIdealState
            visual="error"
            title={intl.formatMessage(title)}
          />
        </div>
      </div>
    )
  }
}

class PageNotFound extends Component {
  render() {
    const {intl} = this.props;
    return (
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
    )
  }
}

class ErrorScreen extends Component {
  static PageNotFound = injectIntl(PageNotFound);
  static EmptyList = injectIntl(EmptyList);
}

export default ErrorScreen;
