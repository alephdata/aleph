import React from 'react';
import { Menu, MenuItem, Card, Elevation } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import './Dashboard.scss';

const messages = defineMessages({
  notifications: {
    id: 'dashboard.notifications',
    defaultMessage: 'Notifications',
  },
  no_results_description: {
    id: 'entity.search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
  empty_title: {
    id: 'entity.search.empty_title',
    defaultMessage: 'This folder is empty',
  },
});


class Dashboard extends React.Component {
  render() {
    const { intl } = this.props;
    return (
      <div className="Dashboard">
        <div className="dashboard-menu">
          <Menu>
            <li className="bp3-menu-header">
              <h6 className="bp3-heading">
                <FormattedMessage id="dashboard.activity" defaultMessage="Activity" />
              </h6>
            </li>
            <MenuItem
              icon="notifications"
              text={intl.formatMessage(messages.notifications)}
              href="/notifications"
              active
            />
            <MenuItem text="Searches &amp; alerts" href="/history" />
            <MenuItem text="My datasets" href="/collections" />
            <li className="bp3-menu-header">
              <h6 className="bp3-heading">Settings</h6>
            </li>
            <MenuItem text="Profile" href="/settings" />
          </Menu>
        </div>
        <Card className="dashboard-body" elevation={Elevation.ONE}>
          {this.props.children}
        </Card>
      </div>
    );
  }
}

Dashboard = injectIntl(Dashboard);
export default Dashboard;
