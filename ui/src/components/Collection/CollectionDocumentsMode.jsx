import React, { Component } from 'react';
import { withRouter } from 'react-router';
import DocumentManager from 'components/Document/DocumentManager';
import { queryCollectionDocuments } from 'queries';


class CollectionDocumentsMode extends Component {
  render() {
    const { collection, location } = this.props;
    const query = queryCollectionDocuments(location, collection.id);
    return <DocumentManager query={query} collection={collection} />;
  }
}

CollectionDocumentsMode = withRouter(CollectionDocumentsMode);
export default CollectionDocumentsMode;
