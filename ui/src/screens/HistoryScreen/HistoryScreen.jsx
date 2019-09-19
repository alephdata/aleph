import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
// import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Tab, Tabs } from '@blueprintjs/core';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import AlertsManager from 'src/components/AlertsManager/AlertsManager';
import QueryLogs from 'src/components/QueryLogs/QueryLogs';
// import { DualPane } from 'src/components/common';


import './HistoryScreen.scss';


const messages = defineMessages({
  title: {
    id: 'settings.title',
    defaultMessage: 'Searches & alerts',
  },
  searches: {
    id: 'settings.searchTitle',
    defaultMessage: 'Search history',
  },
  alerts: {
    id: 'settings.alertsTitls',
    defaultMessage: 'Tracking alerts',
  },
});


export class HistoryScreen extends React.Component {
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
    const { activeTab, intl } = this.props;
    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession>
        <Dashboard>
          <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
          <Tabs id="TabsExample" onChange={this.handleTabChange} selectedTabId={activeTab}>
            <Tab
              id="searches"
              title={intl.formatMessage(messages.searches)}
              panel={<QueryLogs />}
              panelClassName="ember-panel"
            />
            <Tab
              id="alerts"
              title={intl.formatMessage(messages.alerts)}
              panel={<AlertsManager />}
              panelClassName="ember-panel"
            />
          </Tabs>
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const parsedHash = queryString.parse(location.hash);
  let activeTab;
  if (parsedHash.alerts !== undefined) {
    activeTab = 'alerts';
  }
  if (parsedHash.searches !== undefined) {
    activeTab = 'searches';
  }
  return {
    activeTab,
    ...state,
  };
};

HistoryScreen = withRouter(HistoryScreen);
HistoryScreen = connect(mapStateToProps, { })(HistoryScreen);
HistoryScreen = injectIntl(HistoryScreen);
export default HistoryScreen;
