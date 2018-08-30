import React from 'react';
import { connect } from "react-redux";
import { withRouter } from 'react-router';

import DocumentManager from 'src/components/Document/DocumentManager';
import { queryCollectionDocuments } from "src/queries";


class CollectionDocumentsMode extends React.Component {
  render() {
    const { collection, query } = this.props;
    return <DocumentManager query={query} collection={collection} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  return {
    query: queryCollectionDocuments(location, collection.id)
  };
};


CollectionDocumentsMode = connect(mapStateToProps, {})(CollectionDocumentsMode);
CollectionDocumentsMode = withRouter(CollectionDocumentsMode);
export default CollectionDocumentsMode;
