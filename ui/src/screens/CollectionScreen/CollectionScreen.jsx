import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import { selectCollection, selectCollectionView } from 'src/selectors';


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    mode: selectCollectionView(state, collectionId, hashQuery.mode),
  };
};

@connect(mapStateToProps)
@withRouter
export default class CollectionScreen extends Component {
  render() {
    const { collectionId, mode } = this.props;
    return (
      <CollectionScreenContext
        collectionId={collectionId}
        activeMode={mode}
      />
    );
  }
}
