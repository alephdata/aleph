import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import QueryLogs from 'src/components/QueryLogs/QueryLogs';

import './HistoryScreen.scss';

const messages = defineMessages({
  title: {
    id: 'history.title',
    defaultMessage: 'Search history',
  },
});

export class HistoryScreen extends React.Component {
  render() {
    const { intl } = this.props;
    return (
      <Screen title={intl.formatMessage(messages.title)} className="HistoryScreen" requireSession>
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="history.screen.subheading"
                defaultMessage="Below is a list of your most recent searches. You have the option to delete specific searches so they do not show up in our records."
              />
            </p>
          </div>
          <QueryLogs />
        </Dashboard>
      </Screen>
    );
  }
}

export default injectIntl(HistoryScreen);
