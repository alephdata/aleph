import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Classes, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Count, Skeleton } from 'src/components/common';
import c from 'classnames';

import { queryRoles } from 'src/actions';
import { queryGroups } from 'src/queries';
import { selectAlerts, selectSessionIsTester, selectRolesResult } from 'src/selectors';

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
    const { groupsQuery, groupsResult } = this.props;
    if (groupsResult.shouldLoad) {
      this.props.queryRoles({query: groupsQuery});
    }
  }

  navigate(path) {
    this.props.history.push(path);
  }

  render() {
    const { alerts, intl, location, groupsResult, showDiagrams } = this.props;
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
            {showDiagrams && (
              <MenuItem
                icon="graph"
                text={intl.formatMessage(messages.diagrams)}
                onClick={() => this.navigate('/diagrams')}
                active={current === '/diagrams'}
              />
            )}
            {(groupsResult.isPending || groupsResult.total > 0) && (
              <>
                <MenuDivider />
                <li className={c('bp3-menu-header', { [Classes.SKELETON]: groupsResult.isPending })}>
                  <h6 className="bp3-heading">
                    <FormattedMessage id="dashboard.groups" defaultMessage="Groups" />
                  </h6>
                </li>
                {!groupsResult.isPending && groupsResult.results.map(group => (
                  <MenuItem
                    key={group.id}
                    icon="shield"
                    text={group.label}
                    onClick={() => this.navigate(`/groups/${group.id}`)}
                    active={current === `/groups/${group.id}`}
                  />
                ))}
                {groupsResult.isPending && (
                  <Skeleton.Text type="li" length={20} className="bp3-menu-item" />
                )}
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

const mapStateToProps = (state, ownProps) => {
  const groupsQuery = queryGroups(ownProps.location);
  return {
    groupsQuery,
    groupsResult: selectRolesResult(state, groupsQuery),
    alerts: selectAlerts(state),
    showDiagrams: selectSessionIsTester(state),
  };
};

Dashboard = injectIntl(Dashboard);
Dashboard = connect(mapStateToProps, { queryRoles })(Dashboard);
Dashboard = withRouter(Dashboard);
export default Dashboard;
