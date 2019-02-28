import React from 'react';
import DocumentManager from 'src/components/Document/DocumentManager';
import { queryCollectionDocuments } from 'src/queries';
import { connectedWIthRouter } from '../../screens/OAuthScreen/enhancers';


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

export default connectedWIthRouter({ mapStateToProps })(CollectionDocumentsMode);
