import React, {Component} from 'react';
import {Button} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';

import DualPane from 'src/components/common/DualPane';
import CollectionEditTable from "./CollectionEditTable";
import {fetchCollectionPermissions, fetchUsers, updateCollection, updateCollectionPermissions} from 'src/actions';
import SuggestInput from 'src/components/common/SuggestInput';
import {showErrorToast, showInfoToast, showSuccessToast} from 'src/app/toast';

import './CollectionEditContent.css';

class CollectionEditContent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      newUser: {},
      collectionId: -1,
      listUsers: [],
      permissions: {}
    };

    this.onAddUser = this.onAddUser.bind(this);
    this.onTyping = this.onTyping.bind(this);
    this.onSelectUser = this.onSelectUser.bind(this);
    this.handleCheckboxWrite = this.handleCheckboxWrite.bind(this);
    this.handleCheckboxRead = this.handleCheckboxRead.bind(this);
    this.onSavePermissions = this.onSavePermissions.bind(this);
  }

  async componentWillReceiveProps(nextProps) {
    if (this.props.collection !== nextProps.collection && nextProps.collection.id !== undefined) {
      await this.props.fetchCollectionPermissions(nextProps.collection.id);
      this.setState({
        collectionId: nextProps.collection.id,
        listUsers: nextProps.users.results === undefined ? [] : nextProps.users.results,
        permissions: {
          results: [
            [...this.props.permissions.results ? this.props.permissions.results[0].slice() : []]
          ]
        }
      });
    }
  }

  onAddUser() {
    if (this.state.newUser.id === undefined) {
      showErrorToast('You must select user!');
    }
    let permissions = this.state.permissions;
    let isAlreadyPermission = this.isPermission(this.state.newUser);

    if (!isAlreadyPermission) {
      let newPermissions = {
        ...permissions,
        results: [[...permissions.results[0], this.state.newUser], ...permissions.results.slice(1)]
      };
      this.setState({permissions: newPermissions});
      showInfoToast('You have added new user. Click Save button!');
    } else {
      showInfoToast('You have already added same user!');
    }
  }

  isPermission(user) {
    for (let i = 0; i < this.state.permissions.results[0].length; i++) {
      if (this.state.permissions.results[0][i].role.type === 'user') {
        if (this.state.permissions.results[0][i].role.id === user.role.id) return true;
      }
    }

    return false;
  }

  async onTyping(query) {
    if (query.length >= 3) {
      await this.props.fetchUsers(query);
      this.setState({listUsers: this.props.users.results})
    } else {
      this.setState({listUsers: []})
    }
  }

  onSelectUser(user) {
    let newUser = {...user, role: {type: 'user', id: user.id, name: user.name}, read: false, write: false};
    this.setState({newUser});
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
    console.log('on save', this.state.permissions)
    await this.props.updateCollection(this.props.collection);
    await this.props.updateCollectionPermissions(this.state.permissions.results[0]);
    showSuccessToast('You have saved collection!');
  }

  render() {
    const {collection} = this.props;
    const {listUsers, newUser, permissions} = this.state;

    return (
      <DualPane.ContentPane limitedWidth={true} className="CollectionEditContent">
        <h1>
          <FormattedMessage id="collection.edit.title"
                            defaultMessage="Access Control"/>
        </h1>
        <form onSubmit={this.onAddUser} className="addUserForm">
          <SuggestInput
            defaultValue={newUser.name === undefined ? undefined : newUser.name}
            onSelectItem={this.onSelectUser}
            list={listUsers}
            onTyping={this.onTyping}/>
          <Button className="addUserButton" onClick={this.onAddUser}>
            <FormattedMessage id="user.add"
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
  users: state.users
});

CollectionEditContent = injectIntl(CollectionEditContent);
export default connect(mapStateToProps, {
  fetchCollectionPermissions,
  fetchUsers,
  updateCollection,
  updateCollectionPermissions
})(CollectionEditContent);
