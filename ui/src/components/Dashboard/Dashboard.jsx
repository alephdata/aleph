import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Menu, MenuItem, Card, Elevation } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import { fetchGroups } from 'src/actions';
import { selectGroups } from 'src/selectors';

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
  status: {
    id: 'dashboard.status',
    defaultMessage: 'Status',
  },
});


class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.navigate = this.navigate.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { groups } = this.props;
    if (groups.shouldLoad) {
      this.props.fetchGroups();
    }
  }

  navigate(path) {
    const { history } = this.props;
    history.push(path);
  }

  render() {
    const { intl, location, groups } = this.props;
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
            { groups.total !== undefined && (
              <React.Fragment>
                <li className="bp3-menu-header">
                  <h6 className="bp3-heading">
                    <FormattedMessage id="dashboard.groups" defaultMessage="Groups" />
                  </h6>
                </li>
                { groups.results.map(group => (
                  <MenuItem key={group.id} icon="shield" text={group.label} href="/sources" />
                ))}
              </React.Fragment>
            )}
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
            <MenuItem
              icon="dashboard"
              text={intl.formatMessage(messages.status)}
              onClick={() => this.navigate('/status')}
              active={current === '/status'}
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

const mapStateToProps = (state) => {
  const groups = selectGroups(state);
  return { groups };
};

Dashboard = injectIntl(Dashboard);
Dashboard = withRouter(Dashboard);
Dashboard = connect(mapStateToProps, { fetchGroups })(Dashboard);
export default Dashboard;
