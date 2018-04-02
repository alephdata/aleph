import React, {Component} from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Menu, MenuItem, MenuDivider, Popover, Button, Position } from "@blueprintjs/core";

import SettingsDialog from 'src/dialogs/SettingsDialog';
import AlertsDialog from 'src/dialogs/AlertsDialog';
import AuthenticationDialog from 'src/dialogs/AuthenticationDialog';

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
  },
  signin: {
    id: 'nav.sigin',
    defaultMessage: 'Sign in / Register',
  }
});

class AuthButtons extends Component {
  constructor() {
    super();
    this.state = {
      settingsIsOpen: false,
      alertsIsOpen: false,
      isSignupOpen: false
    };

    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAlerts = this.toggleAlerts.bind(this);
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
  }

  toggleAuthentication() {
    this.setState({
      isSignupOpen: !this.state.isSignupOpen
    })
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
    const targetUrl = `${location.protocol}//${location.host}/oauth`;
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
              <Link to="/notifications" className="pt-menu-item">{intl.formatMessage(messages.view_notifications)}</Link>
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
        <Menu className='menu-item-width' key='oauthmenu'>
        <a key='oauth' href={`${auth.oauth_uri}${loginUrlQueryString}`}>
          <Button icon="log-in" className="pt-minimal">
            <FormattedMessage id="login.oauth" defaultMessage="Sign in"/>
          </Button>
        </a>
        </Menu>
      ))
    }

    if (auth.password_login_uri) {
      items.push((
        <Menu className='menu-item-width' key='signin'>
          <MenuItem icon='log-in' onClick={this.toggleAuthentication} text={intl.formatMessage(messages.signin)} />
          <AuthenticationDialog isOpen={this.state.isSignupOpen} toggleDialog={this.toggleAuthentication} />
        </Menu>
      ))
    }

    return (
      <span className="AuthButtons">
        {items}
      </span>
    )
  }
}

AuthButtons = injectIntl(AuthButtons);
export default AuthButtons;
