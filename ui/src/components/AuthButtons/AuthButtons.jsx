import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Truncate from 'react-truncate';
import { Button, Classes, Menu, MenuDivider } from '@blueprintjs/core';
import { Popover2 as Popover } from '@blueprintjs/popover2';

import { fetchRole } from 'actions';
import {
  selectCurrentRole,
  selectCurrentRoleId,
  selectMetadata,
} from 'selectors';
import AuthenticationDialog from 'dialogs/AuthenticationDialog/AuthenticationDialog';
import { DialogToggleButton } from 'components/Toolbar';
import { Skeleton, LinkMenuItem } from 'components/common';

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
  timelines: {
    id: 'nav.timelines',
    defaultMessage: 'Timelines',
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
  cases: {
    id: 'nav.menu.cases',
    defaultMessage: 'Investigations',
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
    if (role.shouldLoadDeep) {
      this.props.fetchRole({ id: roleId });
    }
  }

  renderSkeleton() {
    return <Skeleton.Text type="span" length="10" className="AuthButtons" />;
  }

  render() {
    const { role, metadata, intl } = this.props;

    if (!role.id && role.isPending) {
      return this.renderSkeleton();
    }

    if (!!role.id) {
      return (
        <span className="AuthButtons">
          <Popover
            popoverClassName="AuthButtons__popover"
            placement="bottom-end"
            fill
            content={
              <Menu className="AuthButtons__popover__menu">
                <LinkMenuItem
                  to="/notifications"
                  icon="notifications"
                  text={intl.formatMessage(messages.notifications)}
                />
                <LinkMenuItem
                  to="/alerts"
                  icon="feed"
                  text={intl.formatMessage(messages.alerts)}
                />
                <LinkMenuItem
                  to="/exports"
                  icon="export"
                  text={intl.formatMessage(messages.exports)}
                />
                <MenuDivider />
                <LinkMenuItem
                  to="/investigations"
                  icon="briefcase"
                  text={intl.formatMessage(messages.cases)}
                />
                <LinkMenuItem
                  to="/diagrams"
                  icon="graph"
                  text={intl.formatMessage(messages.diagrams)}
                />
                <LinkMenuItem
                  to="/timelines"
                  icon="gantt-chart"
                  text={intl.formatMessage(messages.timelines)}
                />
                <LinkMenuItem
                  to="/lists"
                  icon="list"
                  text={intl.formatMessage(messages.lists)}
                />
                <MenuDivider />
                <LinkMenuItem
                  to="/settings"
                  icon="cog"
                  text={intl.formatMessage(messages.settings)}
                />
                <LinkMenuItem
                  to="/status"
                  icon="dashboard"
                  text={intl.formatMessage(messages.status)}
                />
                <LinkMenuItem
                  to="/logout"
                  icon="log-out"
                  text={intl.formatMessage(messages.signout)}
                />
              </Menu>
            }
          >
            <Button icon="user" minimal rightIcon="caret-down">
              <Truncate lines={2} width={120}>
                {role ? role.name : 'Profile'}
              </Truncate>
            </Button>
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
              className: Classes.MINIMAL,
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
