import React, { Component } from 'react';
import { connect } from "react-redux";

import { Toolbar, CollectionSearch } from 'src/components/Toolbar';
import DocumentManager from 'src/components/Document/DocumentManager';
import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import Query from 'src/app/Query';
import { fetchCollection, deleteDocument } from "src/actions";
import { selectCollection } from "src/selectors";


class CollectionDocumentsScreen extends Component {
  render() {
    const { collection, collectionId, query } = this.props;
    collection.id = collectionId;
    return (
      <CollectionScreenContext collection={collection}>
        <Toolbar>
          <CollectionSearch collection={collection} />
        </Toolbar>
        <DocumentManager query={query} collection={collection} />
      </CollectionScreenContext>
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
