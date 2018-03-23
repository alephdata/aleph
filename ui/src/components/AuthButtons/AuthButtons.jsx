import React, {Component} from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Menu, MenuItem, MenuDivider, Popover, Button, Position } from "@blueprintjs/core";

import SettingsDialog from 'src/dialogs/SettingsDialog';
import AlertsDialog from 'src/dialogs/AlertsDialog';

import './AuthButtons.css';

const messages = defineMessages({
  alerts: {
    id: 'nav.manage_alerts',
    defaultMessage: 'Manage alerts',
  },
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
  }
});

class AuthButtons extends Component {
  constructor() {
    super();
    this.state = {
      settingsIsOpen: false,
      alertsIsOpen: false,
    };

    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAlerts = this.toggleAlerts.bind(this);
  }

  toggleSettings() {
    this.setState({
      settingsIsOpen: !this.state.settingsIsOpen
    })
  }

  toggleAlerts() {
    this.setState({
      alertsIsOpen: !this.state.alertsIsOpen
    })
  }

  render() {
    const {session, auth, intl} = this.props;
    const location = window.location;
    const targetUrl = `${location.protocol}//${location.host}/login`;
    const loginUrlQueryString = `?next=${encodeURIComponent(targetUrl)}`;
    const items = [];

    if (session.loggedIn) {
      return ( 
        <span className="AuthButtons">
          <Popover content={
            <Menu>
              <MenuItem icon="cog" onClick={this.toggleSettings} text={intl.formatMessage(messages.settings)+'…'} />
              <MenuDivider />
              <MenuItem icon="log-out" href="/logout" text={intl.formatMessage(messages.signout)} />
            </Menu>
            } position={Position.BOTTOM_LEFT}>
            <Button icon="user" className="pt-minimal" />
          </Popover>

          <Popover content={
            <Menu>
              <MenuItem onClick={this.toggleAlerts} text={intl.formatMessage(messages.alerts)+'…'} />
              <MenuItem href="/notifications" text={intl.formatMessage(messages.view_notifications)} />
            </Menu>
            } position={Position.BOTTOM_LEFT}>
            <Button icon="notifications" className="pt-minimal" />
          </Popover>
              
          <AlertsDialog isOpen={this.state.alertsIsOpen} toggleDialog={this.toggleAlerts} />
          <SettingsDialog isOpen={this.state.settingsIsOpen} toggleDialog={this.toggleSettings} />
        </span>
      )
    }

    if (auth.oauth_uri) {
      items.push((
        <a key='oauth' href={`${auth.oauth_uri}${loginUrlQueryString}`}>
          <Button icon="user" className="pt-minimal">
            <FormattedMessage id="login.oauth" defaultMessage="Sign in"/>
          </Button>
        </a>
      ))
    }

    if (auth.password_login_uri) {
      items.push((
        <Link key='login' to="/login">
          <Button icon="log-in" className="pt-minimal">
            <FormattedMessage id="nav.signin" defaultMessage="Sign in"/>
          </Button>
        </Link>
      ))
    }

    if (auth.registration_uri) {
      items.push((
        <Link key='signup' to="/signup">
          <Button icon="user" className="pt-minimal">
            <FormattedMessage id="nav.signup" defaultMessage="Register"/>
          </Button>
        </Link>
      ))
    }

    return (
      <span className="AuthButtons">{items}</span>
    )
  }
}

AuthButtons = injectIntl(AuthButtons);
export default AuthButtons;
