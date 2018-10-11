import React, { Component } from 'react';
import { connect } from 'react-redux';

import Screen from 'src/components/Screen/Screen';
import CollectionContextLoader from 'src/components/Collection/CollectionContextLoader';
import CollectionToolbar from 'src/components/Collection/CollectionToolbar';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import CollectionViewsMenu from 'src/components/ViewsMenu/CollectionViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs } from 'src/components/common';
import { selectCollection } from "src/selectors";


class CollectionScreenContext extends Component {
  render() {
    const { collection, collectionId, activeMode, screenTitle } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.shouldLoad || collection.isLoading) {
      return (
        <CollectionContextLoader collectionId={collectionId}>
          <LoadingScreen />
        </CollectionContextLoader>
      );
    }

    const breadcrumbs = (<Breadcrumbs collection={collection} hasSearchBar={false}>
      <Breadcrumbs.Text text={screenTitle} />
    </Breadcrumbs>);

    return (
      <CollectionContextLoader collectionId={collectionId}>
        <Screen title={`${screenTitle}: ${collection.label}`}>
          {breadcrumbs}
          <DualPane>
            <DualPane.ContentPane className="view-menu-flex-direction">
              <CollectionViewsMenu collection={collection}
                                   activeMode={activeMode}
                                   isPreview={false} />
              <div className="screen-children">
                {this.props.children}
              </div>
            </DualPane.ContentPane>
            <DualPane.InfoPane className="with-heading">
              <CollectionToolbar collection={collection} />
              <CollectionInfoMode collection={collection} />
            </DualPane.InfoPane>
          </DualPane>
        </Screen>
      </CollectionContextLoader>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;
  return {
    collection: selectCollection(state, collectionId)
  };
};

CollectionScreenContext = connect(mapStateToProps, {})(CollectionScreenContext);
export default (CollectionScreenContext);
