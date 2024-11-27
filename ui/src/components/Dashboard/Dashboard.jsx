import React from 'react';
import { connect } from 'react-redux';
import { Classes, Menu, MenuDivider } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Count, Skeleton, AppItem, LinkMenuItem } from 'components/common';

import withRouter from 'app/withRouter';
import { queryRoles } from 'actions';
import { groupsQuery } from 'queries';
import { selectRolesResult, selectCurrentRole } from 'selectors';

import './Dashboard.scss';

const messages = defineMessages({
  notifications: {
    id: 'dashboard.notifications',
    defaultMessage: 'Notifications',
  },
  alerts: {
    id: 'dashboard.alerts',
    defaultMessage: 'Alerts',
  },
  exports: {
    id: 'dashboard.exports',
    defaultMessage: 'Exports',
  },
  cases: {
    id: 'dashboard.cases',
    defaultMessage: 'Investigations',
  },
  diagrams: {
    id: 'dashboard.diagrams',
    defaultMessage: 'Network diagrams',
  },
  lists: {
    id: 'dashboard.lists',
    defaultMessage: 'Lists',
  },
  timelines: {
    id: 'dashboard.timelines',
    defaultMessage: 'Timelines',
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
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { groupsQuery, groupsResult } = this.props;
    if (groupsResult.shouldLoad) {
      this.props.queryRoles({ query: groupsQuery });
    }
  }

  render() {
    const { role, intl, location, groupsResult } = this.props;
    const current = location.pathname;

    return (
      <div className="Dashboard">
        <div className="Dashboard__inner-container">
          <div className="Dashboard__menu">
            <Menu>
              <MenuDivider
                title={
                  <FormattedMessage
                    id="dashboard.activity"
                    defaultMessage="Activity"
                  />
                }
              />
              <LinkMenuItem
                icon="notifications"
                text={intl.formatMessage(messages.notifications)}
                to="/notifications"
                active={current === '/notifications'}
              />
              <LinkMenuItem
                icon="feed"
                text={intl.formatMessage(messages.alerts)}
                label={<Count count={role?.counts?.alerts || 0} />}
                to="/alerts"
                active={current === '/alerts'}
              />
              <LinkMenuItem
                icon="export"
                text={intl.formatMessage(messages.exports)}
                label={<Count count={role?.counts?.exports || 0} />}
                to="/exports"
                active={current === '/exports'}
              />
              <MenuDivider />
              <MenuDivider
                title={
                  <FormattedMessage
                    id="dashboard.workspace"
                    defaultMessage="Workspace"
                  />
                }
              />
              <LinkMenuItem
                icon="briefcase"
                text={intl.formatMessage(messages.cases)}
                label={<Count count={role?.counts?.casefiles || 0} />}
                to="/investigations"
                active={current === '/investigations'}
              />
              <LinkMenuItem
                icon="graph"
                text={intl.formatMessage(messages.diagrams)}
                label={<Count count={role?.counts?.entitysets?.diagram || 0} />}
                to="/diagrams"
                active={current === '/diagrams'}
              />
              <LinkMenuItem
                icon="gantt-chart"
                text={intl.formatMessage(messages.timelines)}
                label={<Count count={role?.counts?.entitysets?.timeline || 0} />}
                to="/timelines"
                active={current === '/timelines'}
              />
              <LinkMenuItem
                icon="list"
                text={intl.formatMessage(messages.lists)}
                label={<Count count={role?.counts?.entitysets?.list || 0} />}
                to="/lists"
                active={current === '/lists'}
              />
              {(groupsResult.total === undefined || groupsResult.total > 0) && (
                <>
                  <MenuDivider />
                  <MenuDivider
                    className={
                      groupsResult.total === undefined && Classes.SKELETON
                    }
                    title={
                      <FormattedMessage
                        id="dashboard.groups"
                        defaultMessage="Groups"
                      />
                    }
                  />
                  {groupsResult.results !== undefined &&
                    groupsResult.results.map((group) => (
                      <LinkMenuItem
                        key={group.id}
                        icon="shield"
                        text={group.label}
                        to={`/groups/${group.id}`}
                        active={current === `/groups/${group.id}`}
                      />
                    ))}
                  {groupsResult.total === undefined && (
                    <Skeleton.Text
                      type="li"
                      length={20}
                      className={Classes.MENU_ITEM}
                    />
                  )}
                </>
              )}
              <MenuDivider />
              <LinkMenuItem
                icon="dashboard"
                text={intl.formatMessage(messages.status)}
                to="/status"
                active={current === '/status'}
              />
              <LinkMenuItem
                icon="cog"
                text={intl.formatMessage(messages.settings)}
                to="/settings"
                active={current === '/settings'}
              />
              <MenuDivider />
              <AppItem />
            </Menu>
          </div>
          <div className="Dashboard__body">{this.props.children}</div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = groupsQuery(location);
  return {
    role: selectCurrentRole(state),
    groupsQuery: query,
    groupsResult: selectRolesResult(state, query),
  };
};

Dashboard = injectIntl(Dashboard);
Dashboard = connect(mapStateToProps, { queryRoles })(Dashboard);
Dashboard = withRouter(Dashboard);
export default Dashboard;
