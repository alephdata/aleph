import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import DocumentManager from 'src/components/Document/DocumentManager';
import { queryCollectionDocuments } from 'src/queries';


class CollectionDocumentsMode extends React.PureComponent {
  render() {
    const { collection, query } = this.props;
    return <DocumentManager query={query} collection={collection} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  return {
    query: queryCollectionDocuments(location, collection.id),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionDocumentsMode);
