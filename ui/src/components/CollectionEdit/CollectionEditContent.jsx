import React, {Component} from 'react';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';

import DualPane from 'src/components/common/DualPane';
import CollectionEditTable from "./CollectionEditTable";
import {fetchCollectionPermissions} from 'src/actions';

import './CollectionEditContent.css';

class CollectionEditContent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      newUser: '',
      collectionId: -1
    };

    this.onAddUser = this.onAddUser.bind(this);
    this.onChangeAddingInput = this.onChangeAddingInput.bind(this);
  }

  componentDidMount() {
    console.log('did', this.props.collection)
    //if(this.props.collection !== undefined) this.props.fetchCollectionPermissions(this.props.collection.id);
  }

  componentWillMount() {
    console.log('will')
  }

  componentWillReceiveProps(nextProps) {
    console.log('props', nextProps.collection.isFetching === undefined && this.state.collectionId === -1)
    if (nextProps.collection.isFetching === undefined && this.state.collectionId === -1) {
      this.setState({collectionId: nextProps.collection.id})
      this.props.fetchCollectionPermissions(nextProps.collection.id);
    }
  }

  componentDidUpdate() {
    console.log('update')
    //this.props.fetchCollectionPermissions(this.state.collectionId);
  }

  componentWillUpdate(nextProps) {
    if (nextProps.collection.isFetching === undefined) {
      //this.props.fetchCollectionPermissions(nextProps.collection.id);
    }
  }

  onAddUser(user) {

  }

  onChangeAddingInput({target}) {
    this.setState({newUser: target.value});
  }

  render() {
    const {intl} = this.props;
    console.log('render', this.props.permissions, this.props.collection)

    return (
      <DualPane.ContentPane isLimited={true} className="CollectionEditContent">
        <div className='main_div'>
          <div className='title_div'>
            <h1 className='collection_edit_title'>
              <FormattedMessage id="collection.edit.title"
                                defaultMessage="Acces Control"/>
            </h1>
          </div>
          <div className='add_user_div'>
            <form onSubmit={this.onAddUser} className="search_form">
              <div className="pt-form-content add_user">
                <input
                  id="add_alert"
                  className="pt-input add_user_input"
                  placeholder={intl.formatMessage({
                    id: "collection.edit.add.placeholder",
                    defaultMessage: "Grant access to more users"
                  })}
                  type="text"
                  dir="auto"
                  autoComplete="off"
                  onChange={this.onChangeAddingInput}
                  value={this.state.newUser}
                />
                <div
                  className="pt-button-group pt-fill collection_edit_button_div"
                  onClick={this.onAddAlert}>
                  <AnchorButton>
                    <FormattedMessage id="user.add"
                                      defaultMessage="Add"/>
                  </AnchorButton>
                </div>
              </div>
            </form>
          </div>
        </div>
        <CollectionEditTable users={[]}/>
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  permissions: state.permissions
});

CollectionEditContent = injectIntl(CollectionEditContent);
export default connect(mapStateToProps, {fetchCollectionPermissions})(CollectionEditContent);
