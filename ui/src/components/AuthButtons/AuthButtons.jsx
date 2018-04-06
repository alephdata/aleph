import React, {Component} from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Menu, MenuItem, MenuDivider, Popover, Button, Position, Icon } from "@blueprintjs/core";

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
    const items = [];

    if (session.loggedIn) {
      return ( 
        <span className="AuthButtons">
          <Popover content={
            <Menu>
              <Link to="/notifications" className="pt-menu-item">
                <Icon icon="timeline-events" /> {' '}
                <div class="pt-text-overflow-ellipsis pt-fill">
                  {intl.formatMessage(messages.view_notifications)}
                </div>
              </Link>
              <MenuItem icon="notifications" onClick={this.toggleAlerts} text={intl.formatMessage(messages.alerts)+'…'} />
              <MenuItem icon="cog" onClick={this.toggleSettings} text={intl.formatMessage(messages.settings)+'…'} />
              <MenuDivider />
              <MenuItem icon="log-out" href="/logout" text={intl.formatMessage(messages.signout)} />
            </Menu>
            } position={Position.BOTTOM_LEFT}>
            <Button icon="user" className="pt-minimal" />
          </Popover>

          <AlertsDialog isOpen={this.state.alertsIsOpen} toggleDialog={this.toggleAlerts} />
          <SettingsDialog isOpen={this.state.settingsIsOpen} toggleDialog={this.toggleSettings} />
        </span>
      )
    }

    if (auth.password_login_uri || auth.oauth_uri) {
      return (
        <span className="AuthButtons">
          <Menu className='menu-item-width' key='signin'>
            <MenuItem icon='log-in' onClick={this.toggleAuthentication} text={intl.formatMessage(messages.signin)} />
            <AuthenticationDialog auth={auth} isOpen={this.state.isSignupOpen} toggleDialog={this.toggleAuthentication} />
          </Menu>
        </span>
      );
    }

    return null;
  }
}

AuthButtons = injectIntl(AuthButtons);
export default AuthButtons;
