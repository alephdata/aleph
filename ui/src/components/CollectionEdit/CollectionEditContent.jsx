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
      newUser: '',
      collectionId: -1,
      listUsers: [],
    };

    this.onAddUser = this.onAddUser.bind(this);
    this.onChangeAddingInput = this.onChangeAddingInput.bind(this);
    this.onTyping = this.onTyping.bind(this);
  }

  componentDidMount() {
    this.props.fetchUsers('emi');
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.collection.isFetching === undefined && this.state.collectionId === -1) {
      console.log('propsss')
      this.setState({
        collectionId: nextProps.collection.id,
        listUsers: nextProps.users.results});
      this.props.fetchCollectionPermissions(nextProps.collection.id);
    }
  }

  onAddUser(user) {
    console.log('add', user, this.props.collection)
  }

  onTyping(query) {
    this.props.fetchUsers(query);
    this.setState({listUsers: this.props.users.results})
  }

  onChangeAddingInput({target}) {
    this.setState({newUser: target.value});
  }

  render() {
    const {intl, permissions} = this.props;
    const {listUsers} = this.state
    console.log('render', this.props, this.state)

    return (
      <DualPane.ContentPane limitedWidth={true} className="CollectionEditContent">
            <h1>
              <FormattedMessage id="collection.edit.title"
                                defaultMessage="Access Control"/>
            </h1>
            <form onSubmit={this.onAddUser} className="addUserForm">
              <SuggestInput
                onSelectCountry={this.onSelectUser}
                onRemoveCountry={this.onRemoveUser}
                list={listUsers}/>
              {/*<input
                  className="pt-input addUserInput"
                  placeholder={intl.formatMessage({
                    id: "collection.edit.add.placeholder",
                    defaultMessage: "Grant access to more users"
                  })}
                  type="text"
                  dir="auto"
                  autoComplete="off"
                  onChange={this.onChangeAddingInput}
                  value={this.state.newUser}
                />*/}
                <Button className="addUserButton" onClick={this.onAddUser}>
                  <FormattedMessage id="user.add"
                                    defaultMessage="Add"/>
                </Button>
            </form>
        <CollectionEditTable permissions={permissions} collection={this.props.collection}/>
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  permissions: state.permissions,
  users: state.users
});

CollectionEditContent = injectIntl(CollectionEditContent);
export default connect(mapStateToProps, {fetchCollectionPermissions, fetchUsers, updateCollection})(CollectionEditContent);
