import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Truncate from 'react-truncate';
import {
  Button,
  Classes,
  Icon,
  Menu,
  MenuDivider,
  MenuItem,
} from '@blueprintjs/core';
import { Popover2 as Popover } from '@blueprintjs/popover2';
import c from 'classnames';

import { fetchRole } from 'actions';
import {
  selectCurrentRole,
  selectCurrentRoleId,
  selectMetadata,
} from 'selectors';
import AuthenticationDialog from 'dialogs/AuthenticationDialog/AuthenticationDialog';
import { DialogToggleButton } from 'components/Toolbar';
import { Skeleton } from 'components/common';

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
            content={
              <Menu className="AuthButtons__popover__menu">
                <Link to="/notifications" className={Classes.MENU_ITEM}>
                  <Icon icon="notifications" />{' '}
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.notifications)}
                  </div>
                </Link>
                <Link to="/alerts" className={Classes.MENU_ITEM}>
                  <Icon icon="feed" />
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.alerts)}
                  </div>
                </Link>
                <Link to="/exports" className={Classes.MENU_ITEM}>
                  <Icon icon="export" />
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.exports)}
                  </div>
                </Link>
                <MenuDivider />
                <Link
                  to="/investigations"
                  className={c(Classes.MENU_ITEM, 'mobile-show')}
                >
                  <Icon icon="briefcase" />
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.cases)}
                  </div>
                </Link>
                <Link to="/diagrams" className={Classes.MENU_ITEM}>
                  <Icon icon="graph" />
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.diagrams)}
                  </div>
                </Link>
                <Link to="/timelines" className={Classes.MENU_ITEM}>
                  <Icon icon="gantt-chart" />
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.timelines)}
                  </div>
                </Link>
                <Link to="/lists" className={Classes.MENU_ITEM}>
                  <Icon icon="list" />
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.lists)}
                  </div>
                </Link>
                <MenuDivider />
                <Link to="/settings" className={Classes.MENU_ITEM}>
                  <Icon icon="cog" />{' '}
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.settings)}
                  </div>
                </Link>
                <Link to="/status" className={Classes.MENU_ITEM}>
                  <Icon icon="dashboard" />
                  <div
                    className={c(Classes.TEXT_OVERFLOW_ELLIPSIS, Classes.FILL)}
                  >
                    {intl.formatMessage(messages.status)}
                  </div>
                </Link>
                <MenuItem
                  icon="log-out"
                  href="/logout"
                  text={intl.formatMessage(messages.signout)}
                />
              </Menu>
            }
            placement="bottom-end"
            fill
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
