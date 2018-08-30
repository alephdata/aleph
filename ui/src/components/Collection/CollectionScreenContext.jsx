import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";

import Screen from 'src/components/Screen/Screen';
import CollectionToolbar from 'src/components/Collection/CollectionToolbar';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import CollectionViewsMenu from 'src/components/ViewsMenu/CollectionViewsMenu';
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
    const { collectionId } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({id: collectionId});
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
          <DualPane.InfoPane className="with-heading">
            <CollectionToolbar collection={collection} />
            <CollectionInfoMode collection={collection} />
          </DualPane.InfoPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;
  return {
    collection: selectCollection(state, collectionId),
  };
};

CollectionScreenContext = withRouter(CollectionScreenContext);
CollectionScreenContext = connect(mapStateToProps, { fetchCollection })(CollectionScreenContext);
export default (CollectionScreenContext);
