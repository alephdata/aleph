import React from 'react';
import { withRouter } from 'react-router';
import { Menu, MenuItem, Card, Elevation } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import './Dashboard.scss';

const messages = defineMessages({
  notifications: {
    id: 'dashboard.notifications',
    defaultMessage: 'Notifications',
  },
  settings: {
    id: 'dashboard.settings',
    defaultMessage: 'Settings',
  },
});


class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.navigate = this.navigate.bind(this);
  }

  navigate(path) {
    const { history } = this.props;
    history.push(path);
  }

  render() {
    const { intl, location } = this.props;
    const current = location.pathname;
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
              onClick={() => this.navigate('/notifications')}
              active={current === '/notifications'}
            />
            <MenuItem text="Searches &amp; alerts" href="/history" />
            <MenuItem text="My datasets" href="/collections" />
            <li className="bp3-menu-header">
              <h6 className="bp3-heading">
                <FormattedMessage id="dashboard.system" defaultMessage="System" />
              </h6>
            </li>
            <MenuItem
              icon="cog"
              text={intl.formatMessage(messages.settings)}
              onClick={() => this.navigate('/settings')}
              active={current === '/settings'}
            />
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
Dashboard = withRouter(Dashboard);
export default Dashboard;
