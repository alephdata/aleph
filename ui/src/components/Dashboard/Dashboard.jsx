import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import { fetchGroups } from 'src/actions';
import { selectGroups } from 'src/selectors';

import './Dashboard.scss';

const messages = defineMessages({
  notifications: {
    id: 'dashboard.notifications',
    defaultMessage: 'Notifications',
  },
  history: {
    id: 'dashboard.history',
    defaultMessage: 'Searches & alerts',
  },
  cases: {
    id: 'dashboard.cases',
    defaultMessage: 'Personal datasets',
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
    const { intl, location, groups } = this.props;
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
              onClick={() => this.navigate('/history#alerts')}
              active={current === '/history'}
            />
            <MenuItem
              icon="briefcase"
              text={intl.formatMessage(messages.cases)}
              onClick={() => this.navigate('/cases')}
              active={current === '/cases'}
            />
            { groups.total > 0 && (
              <React.Fragment>
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
              </React.Fragment>
            )}
            <MenuDivider />
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
        <div className="dashboard-body">
          {this.props.children}
        </div>
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
