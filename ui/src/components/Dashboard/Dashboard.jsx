import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Classes, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { ResultCount, Skeleton, AppItem } from 'components/common';
import c from 'classnames';

import Query from 'app/Query';
import { queryCollections, queryEntitySets, queryRoles} from 'actions';
import { queryGroups } from 'queries';
import { selectAlerts, selectCollectionsResult, selectEntitySetsResult, selectRolesResult } from 'selectors';

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
  exports: {
    id: 'dashboard.exports',
    defaultMessage: 'Exports',
  },
  cases: {
    id: 'dashboard.cases',
    defaultMessage: 'Personal datasets',
  },
  diagrams: {
    id: 'dashboard.diagrams',
    defaultMessage: 'Network diagrams',
  },
  lists: {
    id: 'dashboard.lists',
    defaultMessage: 'Lists',
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
    const { groupsQuery, groupsResult, casesCountQuery, casesCountResult, diagramsCountQuery,
      diagramsCountResult, listsCountQuery, listsCountResult } = this.props;

    if (groupsResult.shouldLoad) {
      this.props.queryRoles({query: groupsQuery});
    }
    if (casesCountResult.shouldLoad) {
      this.props.queryCollections({query: casesCountQuery});
    }
    if (diagramsCountResult.shouldLoad) {
      this.props.queryEntitySets({query: diagramsCountQuery});
    }
    if (listsCountResult.shouldLoad) {
      this.props.queryEntitySets({query: listsCountQuery});
    }
  }

  navigate(path) {
    this.props.history.push(path);
  }

  render() {
    const { alerts, casesCountResult, diagramsCountResult, listsCountResult, intl, location, groupsResult } = this.props;
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
              text={intl.formatMessage(messages.alerts)}
              label={<ResultCount result={alerts} />}
              onClick={() => this.navigate('/alerts')}
              active={current === '/alerts'}
            />
            <MenuItem
              icon="download"
              text={intl.formatMessage(messages.exports)}
              onClick={() => this.navigate('/exports')}
              active={current === '/exports'}
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
              label={<ResultCount result={casesCountResult} />}
              onClick={() => this.navigate('/cases')}
              active={current === '/cases'}
            />
            <MenuItem
              icon="graph"
              text={intl.formatMessage(messages.diagrams)}
              label={<ResultCount result={diagramsCountResult} />}
              onClick={() => this.navigate('/diagrams')}
              active={current === '/diagrams'}
            />
            <MenuItem
              icon="list"
              text={intl.formatMessage(messages.lists)}
              label={<ResultCount result={listsCountResult} />}
              onClick={() => this.navigate('/lists')}
              active={current === '/lists'}
            />
            {(groupsResult.total === undefined || groupsResult.total > 0) && (
              <>
                <MenuDivider />
                <li className={c('bp3-menu-header', { [Classes.SKELETON]: groupsResult.isPending })}>
                  <h6 className="bp3-heading">
                    <FormattedMessage id="dashboard.groups" defaultMessage="Groups" />
                  </h6>
                </li>
                {groupsResult.results !== undefined && groupsResult.results.map(group => (
                  <MenuItem
                    key={group.id}
                    icon="shield"
                    text={group.label}
                    onClick={() => this.navigate(`/groups/${group.id}`)}
                    active={current === `/groups/${group.id}`}
                  />
                ))}
                {groupsResult.total === undefined && (
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
            <MenuDivider />
            <AppItem />
          </Menu>
        </div>
        <div className="Dashboard__body">
          {this.props.children}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const groupsQuery = queryGroups(location);
  const caseFilter = {'filter:category': 'casefile'};
  const casesCountQuery = new Query('collections', {}, caseFilter, 'collections')
    .limit(0);

  const diagramsCountQuery = new Query('entitysets', {}, {}, 'entitySets')
    .setFilter('type', 'diagram')
    .limit(0);

  const listsCountQuery = new Query('entitysets', {}, {}, 'entitySets')
    .setFilter('type', 'list')
    .limit(0);

  return {
    groupsQuery,
    groupsResult: selectRolesResult(state, groupsQuery),
    casesCountQuery,
    casesCountResult: selectCollectionsResult(state, casesCountQuery),
    diagramsCountQuery,
    diagramsCountResult: selectEntitySetsResult(state, diagramsCountQuery),
    listsCountQuery,
    listsCountResult: selectEntitySetsResult(state, listsCountQuery),
    alerts: selectAlerts(state),
  };
};

Dashboard = injectIntl(Dashboard);
Dashboard = connect(mapStateToProps, { queryRoles, queryCollections, queryEntitySets })(Dashboard);
Dashboard = withRouter(Dashboard);
export default Dashboard;
