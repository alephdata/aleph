import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import {
  Button, Icon, Menu, MenuDivider, MenuItem, Popover, Position,
} from '@blueprintjs/core';

import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';
import QueryLogsDialog from 'src/dialogs/QueryLogsDialog/QueryLogsDialog';

import './AuthButtons.scss';


const messages = defineMessages({
  notifications: {
    id: 'nav.view_notifications',
    defaultMessage: 'Notifications',
  },
  casefiles: {
    id: 'nav.casefiles',
    defaultMessage: 'Personal datasets',
  },
  diagrams: {
    id: 'nav.diagrams',
    defaultMessage: 'Network diagrams',
  },
  settings: {
    id: 'nav.settings',
    defaultMessage: 'Settings',
  },
  signout: {
    id: 'nav.signout',
    defaultMessage: 'Sign out',
  },
  signin: {
    id: 'nav.signin_register',
    defaultMessage: 'Sign in / Register',
  },
  querylogs: {
    id: 'nav.querylogs',
    defaultMessage: 'Search history',
  },
  alerts: {
    id: 'nav.alerts',
    defaultMessage: 'Alerts',
  },
});
export class AuthButtons extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryLogsIsOpen: false,
      isSignupOpen: false,
    };
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
  }

  toggleQueryLogs = () => this.setState(state => ({ queryLogsIsOpen: !state.queryLogsIsOpen }));

  toggleAuthentication() {
    this.setState(({ isSignupOpen }) => ({ isSignupOpen: !isSignupOpen }));
  }

  render() {
    const { session, role, auth, intl } = this.props;

    if (session.loggedIn) {
      return (
        <span className="AuthButtons">
          <Popover
            content={(
              <Menu className="AuthButtons__popover">
                <Link to="/notifications" className="bp3-menu-item">
                  <Icon icon="notifications" />
                  {' '}
                  {' '}
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.notifications)}
                  </div>
                </Link>
                <Link to="/history" className="bp3-menu-item">
                  <Icon icon="history" />
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.querylogs)}
                  </div>
                </Link>
                <Link to="/alerts" className="bp3-menu-item">
                  <Icon icon="feed" />
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.alerts)}
                  </div>
                </Link>
                <MenuDivider />
                <Link to="/cases" className="bp3-menu-item">
                  <Icon icon="briefcase" />
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.casefiles)}
                  </div>
                </Link>
                {role.is_tester && (
                  <Link to="/diagrams" className="bp3-menu-item">
                    <Icon icon="graph" />
                    <div className="bp3-text-overflow-ellipsis bp3-fill">
                      {intl.formatMessage(messages.diagrams)}
                    </div>
                  </Link>
                )}
                <MenuDivider />
                <Link to="/settings" className="bp3-menu-item">
                  <Icon icon="cog" />
                  {' '}
                  {' '}
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.settings)}
                  </div>
                </Link>
                <MenuItem icon="log-out" href="/logout" text={intl.formatMessage(messages.signout)} />
              </Menu>
            )}
            position={Position.BOTTOM_LEFT}
            fill
          >
            <Button icon="user" className="bp3-minimal" rightIcon="caret-down" text={role ? role.name : 'Profile'} />
          </Popover>
          <QueryLogsDialog
            isOpen={this.state.queryLogsIsOpen}
            toggleDialog={this.toggleQueryLogs}
          />
        </span>
      );
    }

    if (auth.password_login_uri || auth.oauth_uri) {
      return (
        <span className="AuthButtons">
          <AuthenticationDialog
            auth={auth}
            isOpen={this.state.isSignupOpen}
            toggleDialog={this.toggleAuthentication}
          />
          <Button icon="log-in" className="bp3-minimal" onClick={this.toggleAuthentication}>
            <FormattedMessage id="nav.signin" defaultMessage="Sign in" />
          </Button>
        </span>
      );
    }

    return null;
  }
}
export default injectIntl(AuthButtons);
