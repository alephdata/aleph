import React, { Component } from 'react';
import { connect } from 'react-redux';

import Article from 'components/Article';
import CollectionContent from './CollectionContent';
import CollectionInfo from './CollectionInfo';

class CollectionScreen extends Component {
  render() {
    const { collection } = this.props;
    return (
      <Article>
        <CollectionInfo collection={collection} />
        <CollectionContent collection={collection} />
      </Article>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const collection = state.collections.results[collectionId];
  // TODO handle case where collection is undefined / not loaded yet.
  return {
    collection,
  };
};

export default connect(mapStateToProps)(CollectionScreen);
