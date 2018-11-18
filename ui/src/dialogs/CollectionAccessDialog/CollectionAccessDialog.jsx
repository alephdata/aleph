import React, {Component} from 'react';
import { Button, Checkbox, Dialog, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { updateCollectionPermissions, fetchCollectionPermissions } from 'src/actions';
import { selectCollectionPermissions } from 'src/selectors';
import { Role } from 'src/components/common';
import { showSuccessToast, showWarningToast } from "src/app/toast";

import './CollectionAccessDialog.scss';


const messages = defineMessages({
  title: {
    id: 'collection.edit.title',
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


class PermissionRow extends Component {
  render() {
    const { permission, onToggle } = this.props;
    return (<tr>
      <td>
        <Role.Label role={permission.role} long={true} icon={false} />
      </td>
      <td className='other-rows'>
        <Checkbox checked={permission.read}
                  onClick={() => onToggle(permission, 'read')} />
      </td>
      <td className='other-rows'>
        <Checkbox checked={permission.write}
                  onClick={() => onToggle(permission, 'write')} />
      </td>
    </tr>);
  }
}


class CollectionAccessDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      permissions: [],
      blocking: false
    };
    this.onAddRole = this.onAddRole.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidMount() {
    this.fetchPermissions();
  }

  componentDidUpdate(prevProps) {
    const { collection, permissions } = this.props;
    if (prevProps.collection && collection.id !== undefined && prevProps.collection.id !== collection.id) {
      this.fetchPermissions();
    }
    if (!this.state.permissions.length && permissions.results) {
      this.setState({
        permissions: permissions.results,
        blocking: false
      });
    }
  }

  fetchPermissions() {
    const { collection } = this.props;
    this.setState({
      permissions: [],
      blocking: true
    });
    if (collection && collection.writeable) {
      this.props.fetchCollectionPermissions(collection.id);
    }
  }

  filterPermissions(type) {
    const { permissions } = this.state;
    return permissions.filter((perm) =>
      perm.role.type === type
    );
  }

  onAddRole(role) {
    const { permissions } = this.state;
    permissions.push({role: role, read: true, write: false});
    this.setState({permissions: permissions});
  }

  onToggle(permission, flag) {
    const permissions = this.state.permissions.map((perm) => {
      if (perm.role.id === permission.role.id) {
        perm[flag] = !perm[flag];
      }
      return perm;
    });
    this.setState({permissions: permissions});
  }

  async onSave() {
    const { intl, collection, updateCollectionPermissions } = this.props;
    const { permissions, blocking } = this.state;
    if (blocking) return;
    this.setState({blocking: true});
    try {
      await updateCollectionPermissions(collection.id, permissions);
      this.props.toggleDialog();
      this.setState({blocking: false});
      showSuccessToast(intl.formatMessage(messages.save_success));
    } catch (e) {
      this.setState({blocking: false});
      showWarningToast(e.message);
    }
  }

  render() {
    const { collection, intl } = this.props;
    const { permissions, blocking } = this.state;

    if (!collection || !collection.writeable || !permissions) {
      return null;
    }

    const exclude = permissions.map((perm) => perm.role.id);
    return (
      <Dialog icon="key"
              className="CollectionAccessDialog"
              isOpen={this.props.isOpen}
              onClose={this.props.toggleDialog}
              title={intl.formatMessage(messages.title)}>
        <div className="bp3-dialog-body">
          <div className="CollectionPermissions">
            <table className="settings-table">
              <thead>
              <tr key={0}>
                <th/>
                <th>
                  <FormattedMessage id="collection.edit.permissionstable.view"
                                    defaultMessage="View"/>
                </th>
                <th>
                  <FormattedMessage id="collection.edit.permissionstable.edit"
                                    defaultMessage="Edit"/>
                </th>
              </tr>
              </thead>
              <tbody>
              {this.filterPermissions('system').map((permission) =>
                <PermissionRow key={permission.role.id}
                               permission={permission}
                               onToggle={this.onToggle} />
              )}
              <tr key={'groups'}>
                <td className='header-topic' colSpan="3">
                  <FormattedMessage id="collection.edit.groups"
                                    defaultMessage="Groups"/>
                </td>
              </tr>
              {this.filterPermissions('group').map((permission) =>
                <PermissionRow key={permission.role.id}
                               permission={permission}
                               onToggle={this.onToggle} />
              )}
              <tr key={'users'}>
                <td className='header-topic' colSpan="3">
                  <FormattedMessage id="collection.edit.users"
                                    defaultMessage="Users"/>
                </td>
              </tr>
              {this.filterPermissions('user').map((permission) =>
                <PermissionRow key={permission.role.id}
                               permission={permission}
                               onToggle={this.onToggle} />
              )}
              <tr key="add">
                <td colSpan="3">
                  <Role.Select onSelect={this.onAddRole}
                               exclude={exclude} />
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button onClick={this.props.toggleDialog}
                    disabled={blocking}
                    text={intl.formatMessage(messages.cancel_button)} />
            <Button intent={Intent.PRIMARY}
                    onClick={this.onSave}
                    disabled={blocking}
                    text={intl.formatMessage(messages.save_button)} />
          </div>
        </div>
      </Dialog>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.collection.id;
  return { permissions: selectCollectionPermissions(state, collectionId) };
};


CollectionAccessDialog = injectIntl(CollectionAccessDialog);
CollectionAccessDialog = connect(mapStateToProps, {updateCollectionPermissions, fetchCollectionPermissions})(CollectionAccessDialog)
export default CollectionAccessDialog;
