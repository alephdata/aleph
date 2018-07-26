import React, {Component} from 'react';
import { Button, Checkbox, Dialog, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { updateCollectionPermissions, fetchCollectionPermissions } from 'src/actions';
import { selectCollectionPermissions } from 'src/selectors';
import { Role } from 'src/components/common';
import { showSuccessToast } from "src/app/toast";

import './CollectionAccessDialog.css';


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
      permissions: []
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
      this.setState({permissions: []});
      this.fetchPermissions();
    }
    if (!this.state.permissions.length && permissions.results) {
      this.setState({permissions: permissions.results});
    }
  }

  fetchPermissions() {
    const { collection } = this.props;
    this.setState({permissions: []});
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
    const { permissions } = this.state;
    this.props.toggleDialog();
    showSuccessToast(intl.formatMessage(messages.save_success));
    await updateCollectionPermissions(collection.id, permissions);
  }

  render() {
    const {collection, intl} = this.props;
    const {permissions} = this.state;

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
        <div className="pt-dialog-body">
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
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            <Button
              onClick={this.props.toggleDialog}
              text={intl.formatMessage(messages.cancel_button)} />
            <Button
              intent={Intent.PRIMARY}
              onClick={this.onSave}
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
