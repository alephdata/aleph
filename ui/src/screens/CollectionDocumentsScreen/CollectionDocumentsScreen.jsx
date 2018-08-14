import React, { Component } from 'react';
import { connect } from "react-redux";

import { Breadcrumbs } from 'src/components/common';
import { Toolbar, CollectionSearch } from 'src/components/Toolbar';
import DocumentManager from 'src/components/Document/DocumentManager';
import Screen from 'src/components/Screen/Screen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import CaseContext from "src/components/Case/CaseContext";
import Query from 'src/app/Query';
import { fetchCollection, deleteDocument } from "src/actions";
import { selectCollection } from "src/selectors";


class CollectionDocumentsScreen extends Component {

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

  render() {
    const { collection, query } = this.props;

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
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
    'empty:parent': true
  };
  const query = Query.fromLocation('search', location, context, 'document').limit(50);

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    query: query
  };
};

CollectionDocumentsScreen = connect(mapStateToProps, {fetchCollection, deleteDocument})(CollectionDocumentsScreen);
export default CollectionDocumentsScreen;
