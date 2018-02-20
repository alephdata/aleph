import React, {Component} from 'react';
import {Button, MenuItem} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';

import DualPane from 'src/components/common/DualPane';
import CollectionEditTable from "./CollectionEditTable";
import {fetchCollectionPermissions, fetchUsers, updateCollection} from 'src/actions';
import SuggestInput from 'src/components/common/SuggestInput';

import './CollectionEditContent.css';

class CollectionEditContent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      newUser: {},
      collectionId: -1,
      listUsers: [],
      users: []
    };

    this.onAddUser = this.onAddUser.bind(this);
    this.onTyping = this.onTyping.bind(this);
    this.onSelectUser = this.onSelectUser.bind(this);
  }

  componentDidMount() {
    //this.props.fetchUsers('emi');
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.collection.isFetching === undefined && this.state.collectionId === -1) {
      console.log('propsss')
      this.setState({
        collectionId: nextProps.collection.id,
        listUsers: nextProps.users.results === undefined ? [] : nextProps.users.results
      });
      this.props.fetchCollectionPermissions(nextProps.collection.id);
    }
  }

  onAddUser() {
    if (this.state.newUser.id === undefined) alert('no user');
    let usersList = this.state.users;
    usersList.push(this.state.newUser);
    console.log('user list', usersList)
    this.setState({users: usersList});
  }

  async onTyping(event) {
    let query = event.target.value;
    console.log('on typing', query)
    if(query.length >= 3) {
      await this.props.fetchUsers(query);
      this.setState({listUsers: this.props.users.results})
    } else {
      this.setState({listUsers: []})
    }
  }

  onSelectUser(user) {
    this.setState({newUser: user});
  }

  render() {
    const {intl, permissions, collection} = this.props;
    const {listUsers, users} = this.state;
    console.log('list users', listUsers)

    return (
      <DualPane.ContentPane limitedWidth={true} className="CollectionEditContent">
        <h1>
          <FormattedMessage id="collection.edit.title"
                            defaultMessage="Access Control"/>
        </h1>
        <form onSubmit={this.onAddUser} className="addUserForm">
          <SuggestInput
            onSelectItem={this.onSelectUser}
            list={listUsers}
            onTyping={this.onTyping}/>
          <Button className="addUserButton" onClick={this.onAddUser}>
            <FormattedMessage id="user.add"
                              defaultMessage="Add"/>
          </Button>
        </form>
        <CollectionEditTable users={users} permissions={permissions} collection={collection}/>
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
  updateCollection
})(CollectionEditContent);
