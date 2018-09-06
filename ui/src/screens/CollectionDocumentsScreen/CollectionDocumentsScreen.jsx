import React, { Component } from 'react';
import { connect } from "react-redux";

import { Toolbar, CollectionSearch } from 'src/components/Toolbar';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import CollectionScreenContext from 'src/components/Collection/CollectionScreenContext';
import { selectCollection } from "src/selectors";


class CollectionDocumentsScreen extends Component {
  render() {
    const { collection, collectionId } = this.props;
    return (
      <CollectionScreenContext collectionId={collectionId} activeMode="documents">
        <Toolbar>
          <CollectionSearch collection={collection} />
        </Toolbar>
        <CollectionDocumentsMode collection={collection} />
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

CollectionDocumentsScreen = connect(mapStateToProps, {})(CollectionDocumentsScreen);
export default CollectionDocumentsScreen;
