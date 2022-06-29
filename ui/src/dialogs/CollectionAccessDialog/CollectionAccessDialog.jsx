{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component, PureComponent } from 'react';
import { Button, Callout, Checkbox, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { updateCollectionPermissions, fetchCollectionPermissions } from 'actions';
import { selectCollectionPermissions } from 'selectors';
import { Role } from 'components/common';
import FormDialog from 'dialogs/common/FormDialog';
import { showSuccessToast, showWarningToast } from 'app/toast';

import './CollectionAccessDialog.scss';


const messages = defineMessages({
  title: {
    id: 'collection.edit.access_title',
    defaultMessage: 'Access control',
  },
  save_success: {
    id: 'collection.edit.save_success',
    defaultMessage: 'Your changes are saved.',
  },
  cancel_button: {
    id: 'collection.edit.cancel_button',
    defaultMessage: 'Cancel',
  },
  save_button: {
    id: 'collection.edit.save_button',
    defaultMessage: 'Save changes',
  },
});


class PermissionRow extends PureComponent {
  render() {
    const { permission, onToggle } = this.props;
    return (
      <tr>
        <td>
          <Role.Label role={permission.role} long icon={false} />
        </td>
        <td className="other-rows">
          <Checkbox
            checked={permission.read}
            onClick={() => onToggle(permission, 'read')}
          />
        </td>
        <td className="other-rows">
          <Checkbox
            checked={permission.write}
            onClick={() => onToggle(permission, 'write')}
          />
        </td>
      </tr>
    );
  }
}


class CollectionAccessDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      permissions: [],
      blocking: false,
    };
    this.onAddRole = this.onAddRole.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchPermissions();
  }

  componentDidUpdate(prevProps) {
    const { collection, permissions } = this.props;
    if (prevProps.collection
      && collection.id !== undefined
      && prevProps.collection.id !== collection.id) {
      this.fetchPermissions();
    }
    if (!this.state.permissions.length && permissions.results) {
      this.setPermissions(permissions.results, false);
    }
  }

  onAddRole(role) {
    const { permissions } = this.state;
    permissions.push({ role, read: true, write: false });
    this.setState({ permissions });
  }

  onToggle(permission, flag) {
    this.setState(({ permissions }) => ({
      permissions: permissions.map(perm => ({
        ...perm,
        [flag]: perm.role.id === permission.role.id ? !perm[flag] : perm[flag],
      })),
    }));
  }

  async onSubmit() {
    const { intl, collection } = this.props;
    const { permissions, blocking } = this.state;
    if (blocking) return;
    this.setState({ blocking: true });
    try {
      await this.props.updateCollectionPermissions(collection.id, permissions);
      this.props.toggleDialog();
      showSuccessToast(intl.formatMessage(messages.save_success));
    } catch (e) {
      showWarningToast(e.message);
    }
    this.setState({ blocking: false });
  }

  setPermissions(permissions, blocking) {
    this.setState(state => ({
      permissions: permissions || state.permissions,
      blocking: blocking === undefined ? state.blocking : blocking,
    }));
  }

  fetchPermissions() {
    const { collection } = this.props;
    this.setPermissions([], true);
    if (collection && collection.writeable) {
      this.props.fetchCollectionPermissions(collection.id);
    }
  }

  filterPermissions(type) {
    const { permissions } = this.state;
    return permissions.filter(perm => perm.role.type === type);
  }

  render() {
    const { collection, intl } = this.props;
    const { permissions, blocking } = this.state;

    if (!collection || !collection.writeable || !permissions) {
      return null;
    }

    const exclude = permissions.map(perm => perm.role.id);
    const systemRoles = this.filterPermissions('system');
    const groupRoles = this.filterPermissions('group');
    const userRoles = this.filterPermissions('user');
    return (
      <FormDialog
        processing={blocking}
        icon="key"
        className="CollectionAccessDialog"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        title={intl.formatMessage(messages.title)}
        enforceFocus={false}
      >
        <div className="bp3-dialog-body">
          <div className="CollectionPermissions">
            <table className="settings-table">
              <thead>
                <tr key={0}>
                  <th />
                  <th>
                    <FormattedMessage
                      id="collection.edit.permissionstable.view"
                      defaultMessage="View"
                    />
                  </th>
                  <th>
                    <FormattedMessage
                      id="collection.edit.permissionstable.edit"
                      defaultMessage="Edit"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {systemRoles.map(permission => (
                  <PermissionRow
                    key={permission.role.id}
                    permission={permission}
                    onToggle={this.onToggle}
                  />
                ))}
                {groupRoles.length > 0 && (
                  <>
                    <tr key="groups">
                      <td className="header-topic" colSpan="3">
                        <FormattedMessage
                          id="collection.edit.groups"
                          defaultMessage="Groups"
                        />
                      </td>
                    </tr>
                    {groupRoles.map(permission => (
                      <PermissionRow
                        key={permission.role.id}
                        permission={permission}
                        onToggle={this.onToggle}
                      />
                    ))}
                  </>
                )}
                <tr key="users">
                  <td className="header-topic" colSpan="3">
                    <FormattedMessage
                      id="collection.edit.users"
                      defaultMessage="Users"
                    />
                  </td>
                </tr>
                {userRoles.map(permission => (
                  <PermissionRow
                    key={permission.role.id}
                    permission={permission}
                    onToggle={this.onToggle}
                  />
                ))}
                <tr key="add">
                  <td colSpan="3">
                    <Role.Select
                      onSelect={this.onAddRole}
                      exclude={exclude}
                    />
                    <Callout intent={Intent.WARNING}>
                      <FormattedMessage
                        id="collection.edit.permissions_warning"
                        defaultMessage="Note: User must already have an Aleph account in order to receive access."
                      />
                    </Callout>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              onClick={this.props.toggleDialog}
              disabled={blocking}
              text={intl.formatMessage(messages.cancel_button)}
            />
            <Button
              type="button"
              onClick={this.onSubmit}
              intent={Intent.PRIMARY}
              disabled={blocking}
              text={intl.formatMessage(messages.save_button)}
            />
          </div>
        </div>
      </FormDialog>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.collection.id;
  return { permissions: selectCollectionPermissions(state, collectionId) };
};
const mapDispatchToProps = { updateCollectionPermissions, fetchCollectionPermissions };


export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(CollectionAccessDialog);
