import React, { PureComponent } from 'react';
import queryString from 'query-string';

import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import { selectCollection, selectCollectionView } from 'src/selectors';
import { connectedWIthRouter } from '../OAuthScreen/enhancers';


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

export class CollectionScreen extends PureComponent {
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

export default connectedWIthRouter({ mapStateToProps })(CollectionScreen);
