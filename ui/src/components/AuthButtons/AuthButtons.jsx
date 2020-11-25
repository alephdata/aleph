import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  Button, Icon, Menu, MenuDivider, MenuItem, Popover, Position,
} from '@blueprintjs/core';

import { fetchRole } from 'actions';
import { selectCurrentRole, selectCurrentRoleId, selectMetadata } from 'selectors';
import AuthenticationDialog from 'dialogs/AuthenticationDialog/AuthenticationDialog';
import { DialogToggleButton } from 'components/Toolbar'
import './AuthButtons.scss';


const messages = defineMessages({
  notifications: {
    id: 'nav.view_notifications',
    defaultMessage: 'Notifications',
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
    id: 'nav.signin',
    defaultMessage: 'Sign in',
  },
  exports: {
    id: 'nav.exports',
    defaultMessage: 'Exports',
  },
  alerts: {
    id: 'nav.alerts',
    defaultMessage: 'Alerts',
  },
  status: {
    id: 'nav.status',
    defaultMessage: 'System status',
  },
});
export class AuthButtons extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { role, roleId } = this.props;
    if (role.shouldLoad) {
      this.props.fetchRole({ id: roleId });
    }
  }

  render() {
    const { role, metadata, intl } = this.props;

    if (!!role.id) {
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
                <Link to="/status" className="bp3-menu-item">
                  <Icon icon="dashboard" />
                  <div className="bp3-text-overflow-ellipsis bp3-fill">
                    {intl.formatMessage(messages.status)}
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
          <DialogToggleButton
            buttonProps={{
              text: intl.formatMessage(messages.signin),
              icon: 'log-in',
              className: 'bp3-minimal'
            }}
            Dialog={AuthenticationDialog}
            dialogProps={{ auth: metadata.auth }}
          />
        </span>
      );
    }

    return null;
  }
}

const mapStateToProps = (state) => ({
  role: selectCurrentRole(state),
  roleId: selectCurrentRoleId(state),
  metadata: selectMetadata(state),
});

AuthButtons = connect(mapStateToProps, { fetchRole })(AuthButtons);
export default injectIntl(AuthButtons);
