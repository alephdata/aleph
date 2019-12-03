import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Count } from 'src/components/common';

import { fetchGroups } from 'src/actions';
import { selectAlerts, selectGroups } from 'src/selectors';

import './Dashboard.scss';

const messages = defineMessages({
  notifications: {
    id: 'dashboard.notifications',
    defaultMessage: 'Notifications',
  },
  history: {
    id: 'dashboard.history',
    defaultMessage: 'Search history',
  },
  alerts: {
    id: 'dashboard.alerts',
    defaultMessage: 'Alerts',
  },
  cases: {
    id: 'dashboard.cases',
    defaultMessage: 'Personal datasets',
  },
  diagrams: {
    id: 'dashboard.diagrams',
    defaultMessage: 'Network diagrams',
  },
  settings: {
    id: 'dashboard.settings',
    defaultMessage: 'Settings',
  },
  status: {
    id: 'dashboard.status',
    defaultMessage: 'System status',
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
    const { alerts, intl, location, groups } = this.props;
    const current = location.pathname;

    return (
      <div className="Dashboard">
        <div className="Dashboard__menu">
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
            <MenuItem
              icon="history"
              text={intl.formatMessage(messages.history)}
              onClick={() => this.navigate('/history')}
              active={current === '/history'}
            />
            <MenuItem
              icon="feed"
              text={(
                <>
                  <span>{intl.formatMessage(messages.alerts)}</span>
                  <Count count={alerts.total} />
                </>
              )}
              onClick={() => this.navigate('/alerts')}
              active={current === '/alerts'}
            />
            <MenuDivider />
            <li className="bp3-menu-header">
              <h6 className="bp3-heading">
                <FormattedMessage id="dashboard.workspace" defaultMessage="Workspace" />
              </h6>
            </li>
            <MenuItem
              icon="briefcase"
              text={intl.formatMessage(messages.cases)}
              onClick={() => this.navigate('/cases')}
              active={current === '/cases'}
            />
            <MenuItem
              icon="graph"
              text={intl.formatMessage(messages.diagrams)}
              onClick={() => this.navigate('/diagrams')}
              active={current === '/diagrams'}
            />
            { groups.total > 0 && (
              <>
                <MenuDivider />
                <li className="bp3-menu-header">
                  <h6 className="bp3-heading">
                    <FormattedMessage id="dashboard.groups" defaultMessage="Groups" />
                  </h6>
                </li>
                { groups.results.map(group => (
                  <MenuItem
                    key={group.id}
                    icon="shield"
                    text={group.label}
                    onClick={() => this.navigate(`/groups/${group.id}`)}
                    active={current === `/groups/${group.id}`}
                  />
                ))}
              </>
            )}
            <MenuDivider />
            <MenuItem
              icon="dashboard"
              text={intl.formatMessage(messages.status)}
              onClick={() => this.navigate('/status')}
              active={current === '/status'}
            />
            <MenuItem
              icon="cog"
              text={intl.formatMessage(messages.settings)}
              onClick={() => this.navigate('/settings')}
              active={current === '/settings'}
            />
          </Menu>
        </div>
        <div className="dashboard-body">
          {this.props.children}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const alerts = selectAlerts(state);
  const groups = selectGroups(state);
  return { alerts, groups };
};

Dashboard = injectIntl(Dashboard);
Dashboard = withRouter(Dashboard);
Dashboard = connect(mapStateToProps, { fetchGroups })(Dashboard);
export default Dashboard;
