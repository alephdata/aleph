import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";

import Screen from 'src/components/Screen/Screen';
import CollectionInfo from 'src/components/Collection/CollectionInfo';
import CollectionViewsMenu from "../ViewsMenu/CollectionViewsMenu";
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane } from 'src/components/common';
import { fetchCollection } from 'src/actions';


class CollectionScreenContext extends Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const {collection} = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({id: collection.id});
    }
  }

  render() {
    const { collection, activeMode } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.shouldLoad || collection.isLoading) {
      return <LoadingScreen />;
    }

    return (
      <Screen title={collection.label}>
        <DualPane>
          <DualPane.ContentPane className='view-menu-flex-direction'>
            <CollectionViewsMenu collection={collection}
                                 activeMode={activeMode}
                                 isPreview={false} />
            <div>
              {this.props.children}
            </div>
          </DualPane.ContentPane>
          <CollectionInfo collection={collection} />
        </DualPane>
      </Screen>
    );
  }
}

CollectionScreenContext = withRouter(CollectionScreenContext);
CollectionScreenContext = connect(null, { fetchCollection })(CollectionScreenContext);
export default (CollectionScreenContext);
