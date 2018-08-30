import React, { Component } from 'react';
import { connect } from "react-redux";

import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import CollectionXrefIndexMode from 'src/components/Collection/CollectionXrefIndexMode';
import { selectCollection } from 'src/selectors';


class CollectionXrefIndexScreen extends Component {
  render() {
    const { collection, collectionId } = this.props;
    collection.id = collectionId;

    return (
      <CollectionScreenContext collectionId={collectionId} activeMode="xref">
        <CollectionXrefIndexMode collection={collection} />
      </CollectionScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  return {
    collectionId,
    collection: selectCollection(state, collectionId)
  };
};

CollectionXrefIndexScreen = connect(mapStateToProps, {})(CollectionXrefIndexScreen);
export default CollectionXrefIndexScreen;
