import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import AlertsManager from 'src/components/AlertsManager/AlertsManager';

const messages = defineMessages({
  title: {
    id: 'alerts.title',
    defaultMessage: 'Tracking alerts',
  },
});


export class AlertsScreen extends React.Component {
  constructor(props) {
    super(props);

    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange() {
    const { activeTab, history } = this.props;
    const nextTabId = activeTab === 'searches' ? 'alerts' : 'searches';
    history.push({
      hash: nextTabId,
    });
  }

  render() {
    const { intl } = this.props;
    return (
      <Screen title={intl.formatMessage(messages.title)} className="AlertsScreen" requireSession>
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="alert.manager.description"
                defaultMessage="You will receive notifications when a new result is added that matches any of the alerts you have set up below."
              />
            </p>
          </div>
          <AlertsManager />
        </Dashboard>
      </Screen>
    );
  }
}

export default injectIntl(AlertsScreen);
