import React, {Component} from 'react';
import {Button} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';

import DualPane from 'src/components/common/DualPane';
import CollectionEditTable from "./CollectionEditTable";
import {fetchCollectionPermissions, fetchRoles, updateCollection, updateCollectionPermissions} from 'src/actions';
import SuggestInput from 'src/components/common/SuggestInput';
import {showErrorToast, showInfoToast, showSuccessToast} from 'src/app/toast';

import './CollectionEditContent.css';

class CollectionEditContent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      newRole: {},
      collectionId: -1,
      listRoles: [],
      permissions: {}
    };

    this.onAddRole = this.onAddRole.bind(this);
    this.onTyping = this.onTyping.bind(this);
    this.onSelectRole = this.onSelectRole.bind(this);
    this.handleCheckboxWrite = this.handleCheckboxWrite.bind(this);
    this.handleCheckboxRead = this.handleCheckboxRead.bind(this);
    this.onSavePermissions = this.onSavePermissions.bind(this);
  }

  async componentWillReceiveProps(nextProps) {
    if (this.props.collection !== nextProps.collection && nextProps.collection.id !== undefined) {
      await this.props.fetchCollectionPermissions(nextProps.collection.id);
      this.setState({
        collectionId: nextProps.collection.id,
        listRoles: nextProps.roles === undefined ? [] : nextProps.roles.results === undefined ? [] : nextProps.roles.results,
        permissions: {
          results: [
            [...this.props.permissions.results ? this.props.permissions.results[0].slice() : []]
          ]
        }
      });
    }
  }

  onAddRole() {
    if (this.state.newRole.id === undefined) {
      showErrorToast('You must select user!');
    }
    let permissions = this.state.permissions;
    let isAlreadyPermission = this.isPermission(this.state.newRole);

    if (!isAlreadyPermission) {
      let newPermissions = {
        ...permissions,
        results: [[...permissions.results[0], this.state.newRole], ...permissions.results.slice(1)]
      };
      this.setState({permissions: newPermissions});
      showInfoToast('You have added new user. Click Save button!');
    } else {
      showInfoToast('You have already added same user!');
    }
  }

  isPermission(item) {
    for (let i = 0; i < this.state.permissions.results[0].length; i++) {
      if (this.state.permissions.results[0][i].role.type === 'user') {
        if (this.state.permissions.results[0][i].role.id === item.role.id) return true;
      }
    }

    return false;
  }

  async onTyping(query) {
    if (query.length >= 3) {
      await this.props.fetchRoles(query);
      this.setState({listRoles: this.props.roles.results})
    } else {
      this.setState({listRoles: []})
    }

    this.setState({newRole: {name: query}})
  }

  onSelectRole(role) {
    let newRole = {...role, role: {type: 'user', id: role.id, name: role.name}, read: false, write: false};
    this.setState({newRole});
  }

  handleCheckboxWrite(item) {
    let newPermission = item;
    let permissions = this.state.permissions;
    for (let i = 0; i < this.state.permissions.results[0].length; i++) {
      if (this.state.permissions.results[0][i].role.id === item.role.id) {
        newPermission.write = !this.state.permissions.results[0][i].write;
        permissions.results[0][i] = newPermission;
      }
    }

    this.setState({permissions: permissions})
  }

  handleCheckboxRead(item) {
    let newPermission = item;
    let permissions = this.state.permissions;
    for (let i = 0; i < this.state.permissions.results[0].length; i++) {
      if (this.state.permissions.results[0][i].role.id === item.role.id) {
        newPermission.read = !this.state.permissions.results[0][i].read;
        permissions.results[0][i] = newPermission;
      }
    }

    this.setState({permissions: permissions})
  }

  async onSavePermissions() {
    await this.props.updateCollection(this.props.collection);
    await this.props.updateCollectionPermissions(this.state.permissions.results[0]);
    showSuccessToast('You have saved collection!');
  }

  render() {
    const {collection} = this.props;
    const {listRoles, newRole, permissions} = this.state;

    return (
      <DualPane.ContentPane limitedWidth={true} className="CollectionEditContent">
        <h1>
          <FormattedMessage id="collection.edit.title"
                            defaultMessage="Access Control"/>
        </h1>
        <form onSubmit={this.onAddRole} className="addRoleForm">
          <SuggestInput
            defaultValue={newRole.name === undefined ? undefined : newRole.name}
            onSelectItem={this.onSelectRole}
            list={listRoles}
            onTyping={this.onTyping}/>
          <Button className="addRoleButton" onClick={this.onAddRole}>
            <FormattedMessage id="role.add"
                              defaultMessage="Add"/>
          </Button>
        </form>
        <CollectionEditTable
          handleCheckboxRead={this.handleCheckboxRead}
          handleCheckboxWrite={this.handleCheckboxWrite}
          onSave={this.onSavePermissions}
          permissions={permissions}
          collection={collection}
        />
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  permissions: state.permissions,
  roles: state.role
});

CollectionEditContent = injectIntl(CollectionEditContent);
export default connect(mapStateToProps, {
  fetchCollectionPermissions,
  fetchRoles,
  updateCollection,
  updateCollectionPermissions
})(CollectionEditContent);
