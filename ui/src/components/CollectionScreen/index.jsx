import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { NonIdealState } from '@blueprintjs/core';

import { fetchCollection } from 'src/actions';
import Screen from 'src/components/common/Screen';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import CollectionContent from './CollectionContent';
import CollectionInfo from './CollectionInfo';

class CollectionScreen extends Component {
  componentDidMount() {
    const { collectionId } = this.props;
    this.props.fetchCollection({ id: collectionId });
  }

  componentDidUpdate(prevProps) {
    const { collectionId } = this.props;
    if (collectionId !== prevProps.collectionId) {
      this.props.fetchCollection({ id: collectionId });
    }
  }

  render() {
    const { collection, location } = this.props;
    if (collection === undefined || collection.isFetching) {
      return <ScreenLoading />;
    }
    if (collection.error) {
      return (
        <NonIdealState visual="error" title="Collection not found" />
      );
    }
    return (
      <Screen>
        <Helmet>
          <title>{collection.label}</title>
        </Helmet>
        <Breadcrumbs collection={collection} />
        <DualPane>
          <CollectionInfo collection={collection} location={location} />
          <CollectionContent collection={collection} />
        </DualPane>
      </Screen>
      
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const collection = state.collections[collectionId];
  return { collectionId, collection };
};

export default connect(mapStateToProps, { fetchCollection })(CollectionScreen);
