import React, {Component} from 'react';
import {Button} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';

import DualPane from 'src/components/common/DualPane';
import CollectionEditTable from "./CollectionEditTable";
import {fetchCollectionPermissions, fetchUsers, updateCollection} from 'src/actions';
import SuggestInput from 'src/components/common/SuggestInput';
import {showErrorToast} from 'src/app/toast';

import './CollectionEditContent.css';
import {showInfoToast} from "../../app/toast";

class CollectionEditContent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      newUser: {},
      collectionId: -1,
      listUsers: [],
      permissions: []
    };

    this.onAddUser = this.onAddUser.bind(this);
    this.onTyping = this.onTyping.bind(this);
    this.onSelectUser = this.onSelectUser.bind(this);
  }

  componentDidMount() {
    console.log('did mount', this.props)

  }

  async componentWillReceiveProps(nextProps) {
    console.log(this.props !== nextProps)
    if(this.props.collection !== nextProps.collection) {
      console.log('will receive props', nextProps)
      await this.props.fetchCollectionPermissions(nextProps.collection.id);
      this.setState({
        collectionId: nextProps.collection.id,
        listUsers: nextProps.users.results === undefined ? [] : nextProps.users.results,
        permissions: this.props.permissions
      });

    }
  }

  onAddUser() {
    if (this.state.newUser.id === undefined) {
      showErrorToast('You must select user!');
    }
    let permissions = this.state.permissions;
    permissions.results[0].push(this.state.newUser);
    this.setState({permissions: permissions});
    showInfoToast('You have added new user. Click Save button!');
    console.log('DODANO', this.state.permissions)
  }

  async onTyping(query) {
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
    const {collection} = this.props;
    const {listUsers, newUser, permissions} = this.state;
    console.log('render', this.state.permissions)

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
        <CollectionEditTable permissions={permissions} collection={collection}/>
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
