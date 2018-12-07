import React, {Component} from 'react';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import {Link} from 'react-router-dom';
import {Button, Icon, Menu, MenuDivider, MenuItem, Popover, Position} from "@blueprintjs/core";

import SettingsDialog from 'src/dialogs/SettingsDialog/SettingsDialog';
import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';

import './AuthButtons.scss';
import QueryLogsDialog from "../../dialogs/QueryLogsDialog/QueryLogsDialog";

const messages = defineMessages({
  view_notifications: {
    id: 'nav.view_notifications',
    defaultMessage: 'Notifications',
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
    id: 'nav.signin',
    defaultMessage: 'Sign in / Register',
  },
  queryLogs: {
    id: 'nav.queryLogs',
    defaultMessage: 'Search history',
  },
});

class AuthButtons extends Component {
  constructor() {
    super();
    this.state = {
      settingsIsOpen: false,
      queryLogsIsOpen: false,
      isSignupOpen: false
    };

    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
  }

  toggleAuthentication() {
    this.setState({isSignupOpen: !this.state.isSignupOpen})
  }
  toggleQueryLogs = () => this.setState((state) => ({queryLogsIsOpen: !state.queryLogsIsOpen}));


  toggleSettings() {
    this.setState({settingsIsOpen: !this.state.settingsIsOpen})
  }

  render() {
    const {session, auth, intl} = this.props;

    if (session.loggedIn) {
      return (
        <span className="AuthButtons">
          <Popover content={
            <Menu>
              <Link to="/notifications" className="bp3-menu-item">
                <Icon icon="notifications" /> {' '}
                <div className="bp3-text-overflow-ellipsis bp3-fill">
                  {intl.formatMessage(messages.view_notifications)}
                </div>
              </Link>
              <MenuItem icon="history" onClick={this.toggleQueryLogs} text={intl.formatMessage(messages.queryLogs)}/>
              <MenuItem icon="cog" onClick={this.toggleSettings} text={intl.formatMessage(messages.settings)+'…'} />
              <MenuDivider />
              <MenuItem icon="log-out" href="/logout" text={intl.formatMessage(messages.signout)} />
            </Menu>
          } position={Position.BOTTOM_LEFT}>
            <Button icon="user" className="bp3-minimal navbar-option-title">
              <FormattedMessage id="nav.profile" defaultMessage="Profile"/>
            </Button>
          </Popover>
          <SettingsDialog isOpen={this.state.settingsIsOpen} toggleDialog={this.toggleSettings} />
          <QueryLogsDialog isOpen={this.state.queryLogsIsOpen} toggleDialog={this.toggleQueryLogs} />
        </span>
      )
    }

    if (auth.password_login_uri || auth.oauth_uri) {
      return (
          <span className="AuthButtons">
            <AuthenticationDialog auth={auth} isOpen={this.state.isSignupOpen} toggleDialog={this.toggleAuthentication} />
            <Button icon='log-in' className='bp3-minimal' onClick={this.toggleAuthentication}>
              <FormattedMessage id="nav.signin" defaultMessage="Sign in / Register"/>
            </Button>
        </span>
      );
    }

    return null;
  }
}

AuthButtons = injectIntl(AuthButtons);
export default AuthButtons;
