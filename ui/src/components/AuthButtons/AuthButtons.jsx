import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  Button, Icon, Menu, MenuDivider, MenuItem, Popover, Position,
} from '@blueprintjs/core';

import { fetchRole } from 'actions';
import { selectCurrentRole, selectSession, selectMetadata } from 'selectors';
import AuthenticationDialog from 'dialogs/AuthenticationDialog/AuthenticationDialog';

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
  lists: {
    id: 'nav.lists',
    defaultMessage: 'Lists',
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
  exports: {
    id: 'nav.exports',
    defaultMessage: 'Exports',
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
      isSignupOpen: false,
    };
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { role, session } = this.props;
    if (role.shouldLoad && session.loggedIn) {
      this.props.fetchRole({ id: session.id });
    }
  }

  toggleAuthentication() {
    this.setState(({ isSignupOpen }) => ({ isSignupOpen: !isSignupOpen }));
  }

  render() {
    const { session, role, metadata, intl } = this.props;

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
                <Link to="/exports" className="bp3-menu-item">
                  <Icon icon="export" />
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.exports)}
                  </div>
                </Link>
                <MenuDivider />
                <Link to="/cases" className="bp3-menu-item">
                  <Icon icon="briefcase" />
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.casefiles)}
                  </div>
                </Link>
                <Link to="/diagrams" className="bp3-menu-item">
                  <Icon icon="graph" />
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.diagrams)}
                  </div>
                </Link>
                <Link to="/lists" className="bp3-menu-item">
                  <Icon icon="list" />
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.lists)}
                  </div>
                </Link>
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
        </span>
      );
    }

    if (metadata.auth.password_login_uri || metadata.auth.oauth_uri) {
      return (
        <span className="AuthButtons">
          <AuthenticationDialog
            auth={metadata.auth}
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

const mapStateToProps = (state) => ({
  role: selectCurrentRole(state),
  session: selectSession(state),
  metadata: selectMetadata(state),
});

AuthButtons = connect(mapStateToProps, { fetchRole })(AuthButtons);
export default injectIntl(AuthButtons);
