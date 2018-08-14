import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';

import { Breadcrumbs } from 'src/components/common';
import { Toolbar, DocumentUploadButton, DocumentFolderButton, CollectionSearch } from 'src/components/Toolbar';
import Screen from 'src/components/Screen/Screen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import CaseContext from "src/components/Case/CaseContext";
import Query from 'src/app/Query';
import { fetchCollection, deleteDocument } from "src/actions";
import { selectCollection } from "src/selectors";
import DocumentManager from 'src/components/Document/DocumentManager';
import DocumentDeleteDialog from 'src/dialogs/DocumentDeleteDialog/DocumentDeleteDialog';
import { RefreshCallout } from 'src/components/common';

class CollectionDocumentsScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // isDeleteDisabled: true,
      // selectedFiles: [],
      // deleteIsOpen: false,
      // isRefreshCalloutOpen: false
    };

    // this.disableOrEnableDelete = this.disableOrEnableDelete.bind(this);
    // this.setDocuments = this.setDocuments.bind(this);
    // this.toggleDeleteCase = this.toggleDeleteCase.bind(this);
    // this.setRefreshCallout = this.setRefreshCallout.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const {collectionId, collection} = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({id: collectionId});
    }
  }

  // setDocuments(selectedFiles) {
  //   this.setState({selectedFiles: selectedFiles});
  // }

  // disableOrEnableDelete(isDisabled) {
  //   this.setState({isDeleteDisabled: isDisabled});
  // }

  // toggleDeleteCase() {
  //   this.setState({deleteIsOpen: !this.state.deleteIsOpen});
  // }

  // setRefreshCallout() {
  //   this.setState({isRefreshCalloutOpen: !this.state.isRefreshCalloutOpen});
  // }

  render() {
    const { collection, query } = this.props;
    // const { isDeleteDisabled, selectedFiles, isRefreshCalloutOpen } = this.state;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.id === undefined || collection.isLoading) {
      return <LoadingScreen />;
    }

    return (
      <Screen title={collection.label}
              breadcrumbs={<Breadcrumbs collection={collection}/>}
              className='CaseDocumentsScreen'>
        <CaseContext collection={collection} activeTab='Documents'>
          <Toolbar>
            <CollectionSearch collection={collection} />
          </Toolbar>
          <DocumentManager query={query} collection={collection} />
        </CaseContext>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, match } = ownProps;
  const { collectionId } = match.params;
    
  // if (hasSearch) {
  //   context['filter:ancestors'] = document.id;
  // } else {
  //   context['filter:parent.id'] = document.id;
  // }

  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
    'empty:parent': true
  };
  let query = Query.fromLocation('search', location, context, 'document').limit(50);

  // if (queryText) {
  //   query = query.setString('q', queryText);
  // }
  // return { query };

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    query: query
  };
};

CollectionDocumentsScreen = connect(mapStateToProps, {fetchCollection, deleteDocument})(CollectionDocumentsScreen);
export default CollectionDocumentsScreen;
