import React, {Component} from 'react';
import { Checkbox } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

import Role from 'src/components/common/Role';

import './CollectionPermissionsEdit.css';

class PermissionRow extends Component {
  render() {
    const { permission, onToggle } = this.props;
    return (<tr>
      <td className='first-row'>
        {permission.role.name}
      </td>
      <td className='other-rows'>
        <Checkbox className='checkbox-center'
                  checked={permission.read}
                  onChange={() => onToggle(permission, 'read')} />
      </td>
      <td className='other-rows'>
        <Checkbox className='checkbox-center'
                  checked={permission.write}
                  onChange={() => onToggle(permission, 'write')} />
      </td>
    </tr>);
  }
}

class CollectionPermissionsEdit extends Component {

  constructor(props) {
    super(props);

    this.onAddRole = this.onAddRole.bind(this);
    this.onToggle = this.onToggle.bind(this);
  }

  filterPermissions(type) {
    const { permissions } = this.props;
    return permissions.filter((perm) => 
      perm.role.type === type
    );
  }

  onAddRole(role) {
    const { permissions } = this.props;
    permissions.push({role: role, read: true, write: false});
    this.props.onChangePermissions(permissions);
  }

  onToggle(permission, flag) {
    const permissions = this.props.permissions.map((perm) => {
      if (perm.role.id === permission.role.id) {
        perm[flag] = !perm[flag];
      }
      return perm;
    });
    this.props.onChangePermissions(permissions);
  }

  render() {
    const { permissions } = this.props;
    const exclude = permissions.map((perm) => perm.role.id);

    return (
      <div className="CollectionPermissionsEdit">
        <h1>
          <FormattedMessage id="collection.permissions.title"
                            defaultMessage="Access Control"/>
        </h1>

        <table className="settings-table">
          <thead>
            <tr key={0}>
              <th className='topic' />
              <th className='other-topics'>
                <FormattedMessage id="collection.edit.permissionstable.view"
                                  defaultMessage="View"/>
              </th>
              <th className='other-topics'>
                <FormattedMessage id="collection.edit.permissionstable.edit"
                                  defaultMessage="Edit"/>
              </th>
            </tr>
            </thead>
          <tbody className='table_body_alerts'>
            {this.filterPermissions('system').map((permission) => 
              <PermissionRow key={permission.role.id}
                             permission={permission}
                             onToggle={this.onToggle} />
            )}
            <tr key={'groups'} className='table-row'>
              <td className='first-row header_topic'>
                <FormattedMessage id="collection.edit.groups"
                                  defaultMessage="Groups"/>
              </td>
              <td className='other-rows'/>
              <td className='other-rows'/>
            </tr>
            {this.filterPermissions('group').map((permission) => 
              <PermissionRow key={permission.role.id}
                             permission={permission}
                             onToggle={this.onToggle} />
            )}
            <tr key={'users'} className='table-row'>
              <td className='first-row header_topic'>
                <FormattedMessage id="collection.edit.users"
                                  defaultMessage="Users"/>
              </td>
              <td className='other-rows'/>
              <td className='other-rows'/>
            </tr>
            {this.filterPermissions('user').map((permission) => 
              <PermissionRow key={permission.role.id}
                             permission={permission}
                             onToggle={this.onToggle} />
            )}
            <tr key="add" className='table-row'>
              <td className='first-row'>
                <Role.Select onSelect={this.onAddRole}
                             exclude={exclude} />
              </td>
              <td className='other-rows'/>
              <td className='other-rows'/>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default CollectionPermissionsEdit;