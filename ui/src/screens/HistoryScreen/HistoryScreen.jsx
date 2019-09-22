import React from 'react';
import { defineMessages, injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';
import c from 'classnames';
import { Tab, Tabs } from '@blueprintjs/core';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import AlertsManager from 'src/components/AlertsManager/AlertsManager';
import QueryLogs from 'src/components/QueryLogs/QueryLogs';


import './HistoryScreen.scss';


const messages = defineMessages({
  title: {
    id: 'history.title',
    defaultMessage: 'Searches & alerts',
  },
  searches: {
    id: 'history.search.title',
    defaultMessage: 'Search history',
  },
  alerts: {
    id: 'history.alerts.title',
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
    const { activeTab, intl, alerts } = this.props;
    return (
      <Screen title={intl.formatMessage(messages.title)} className="HistoryScreen" requireSession>
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="history.description"
                className="bp3-running-text bp3-muted-text"
                defaultMessage="Manage your search history and set up alerts to track search terms you'd like to follow."
              />
            </p>
          </div>
          <Tabs id="TabsExample" onChange={this.handleTabChange} selectedTabId={activeTab}>
            <Tab
              id="alerts"
              title={(
                <React.Fragment>
                  <span>{intl.formatMessage(messages.alerts)}</span>
                  {alerts.total && (
                    <span className={c('bp3-tag', 'bp3-small', 'bp3-round', { 'bp3-minimal': activeTab !== 'alerts', 'bp3-intent-primary': activeTab === 'alerts' })}>
                      <FormattedNumber value={alerts.total} />
                    </span>
                  )}
                </React.Fragment>
              )}
              className={activeTab === 'alerts' ? 'active' : ''}
              panel={<AlertsManager />}
              panelClassName="ember-panel"
            />
            <Tab
              id="searches"
              title={intl.formatMessage(messages.searches)}
              panel={<QueryLogs />}
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
