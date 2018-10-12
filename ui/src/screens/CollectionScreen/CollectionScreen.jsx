import React, { Component } from 'react';
import { connect } from "react-redux";
import { withRouter } from 'react-router';
import queryString from 'query-string';

import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import { selectCollection, selectCollectionView } from "src/selectors";

// import NotificationList from 'src/components/Notification/NotificationList';
// <NotificationList query={notificationsQuery} />
// const mapStateToProps = (state, ownProps) => {
//   const { location, match } = ownProps;
//   const { collectionId } = match.params;
//   const path = `collections/${collectionId}/notifications`;
//   const query = Query.fromLocation(path, location, {}, 'notifications').limit(40);
//   return {
//     collectionId,
//     collection: selectCollection(state, collectionId),
//     notificationsQuery: query
//   };
// };

class CollectionScreen extends Component {
  render() {
    const { collectionId, collection, mode } = this.props;
    return (
      <CollectionScreenContext collectionId={collectionId}
                               activeMode={mode} />
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    mode: selectCollectionView(state, collectionId, hashQuery.mode)
  };
};

CollectionScreen = connect(mapStateToProps, {})(CollectionScreen);
CollectionScreen = withRouter(CollectionScreen);
export default CollectionScreen;
