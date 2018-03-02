import React, {Component} from 'react';
import {connect} from 'react-redux';
import { Helmet } from 'react-helmet';
import { NonIdealState, Button } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import CollectionPermissionsEdit from './CollectionPermissionsEdit';
import CollectionEditInfo from './CollectionEditInfo';
import ScreenLoading from 'src/components/common/ScreenLoading';
import {showSuccessToast} from 'src/app/toast';

import { fetchCollection, fetchCollectionPermissions } from 'src/actions';
import { updateCollection, updateCollectionPermissions } from 'src/actions';

import './CollectionEdit.css';

const messages = defineMessages({
  access_error: {
    id: 'collection.edit.access_error',
    defaultMessage: 'You cannot edit this collection.',
  },
  save_success: {
    id: 'collection.edit.save_success',
    defaultMessage: 'Your changes are saved.',
  },
});


class CollectionEditScreen extends Component {
  constructor(props){
    super(props);

    this.state = {
      collection: props.collection,
      permissions: props.permissions
    };

    this.onChangeCollection = this.onChangeCollection.bind(this);
    this.onChangePermissions = this.onChangePermissions.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidMount() {
    this.fetchCollection();
  }

  componentDidUpdate(prevProps) {
    if (this.props.collectionId !== prevProps.collectionId) {
      this.fetchCollection();
    }
  }

  fetchCollection() {
    const { collectionId } = this.props;
    this.setState({ permissions: [] });
    this.props.fetchCollection({ id: collectionId });
    this.props.fetchCollectionPermissions(collectionId);
  }

  // componentWillUnmount() {
  //   this.setState({collection: {}, permissions: []})
  // }

  componentWillReceiveProps(nextProps) {
    if(this.props.collection.id !== nextProps.collection.id) {
      this.setState({
        collection: nextProps.collection
      });
    }
    if(nextProps.permissions && !this.state.permissions.length) {
      this.setState({
        permissions: nextProps.permissions
      });
    }
  }

  onChangeCollection(collection) {
    this.setState({
      collection: collection
    })
  }

  onChangePermissions(permissions) {
    this.setState({
      permissions: permissions
    })
  }

  async onSave() {
    const { intl } = this.props;
    const { collection, permissions } = this.state;

    await this.props.updateCollection(collection);
    await this.props.updateCollectionPermissions(collection.id,
                                                 permissions);
    showSuccessToast(intl.formatMessage(messages.save_success));
  }

  render() {
    const { intl, collection } = this.props;
    const { permissions } = this.state;

    if (!collection || !collection.id || !permissions.length) {
      return <ScreenLoading />;
    }

    if(!collection.writeable) {
      return <NonIdealState
        visual="error"
        title={intl.formatMessage(messages.access_error)}/>
    }

    return (
      <Screen>
        <Helmet>
          <title>{collection.label}</title>
        </Helmet>
        <Breadcrumbs collection={collection} />
        <DualPane>
          <CollectionEditInfo collection={this.state.collection} 
                              onChangeCollection={this.onChangeCollection} />
          <DualPane.ContentPane limitedWidth={true} className="CollectionEdit">
            <CollectionPermissionsEdit permissions={permissions}
                                       onChangePermissions={this.onChangePermissions} />
          
            <Button className="save-button" onClick={this.onSave}>
              <FormattedMessage id="collection.edit.save"
                                defaultMessage="Save"/>
            </Button>
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  return {
    collectionId,
    collection: state.collections[collectionId] || {},
    permissions: state.collectionPermissions[collectionId] || []
  };
};

export default connect(mapStateToProps, {
  fetchCollection,
  fetchCollectionPermissions,
  updateCollection,
  updateCollectionPermissions
})(injectIntl(CollectionEditScreen));
