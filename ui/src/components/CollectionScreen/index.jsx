import React, { Component } from 'react';
import { connect } from 'react-redux';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import CollectionContent from './CollectionContent';
import CollectionInfo from './CollectionInfo';

class CollectionScreen extends Component {
  render() {
    const { collection } = this.props;
    return (
      <Screen>
        <Breadcrumbs collection={collection} />
        <DualPane>
          <CollectionInfo collection={collection} />
          <CollectionContent collection={collection} />
        </DualPane>
      </Screen>
      
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const collection = state.collections[collectionId];
  // TODO handle case where collection is undefined / not loaded yet.
  return {
    collection,
  };
};

export default connect(mapStateToProps)(CollectionScreen);
