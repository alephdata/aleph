import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';

import withRouter from '/src/app/withRouter.jsx';
import Screen from '/src/components/Screen/Screen';
import CollectionHeading from '/src/components/Collection/CollectionHeading';
import CollectionViews from '/src/components/Collection/CollectionViews';
import CollectionWrapper from '/src/components/Collection/CollectionWrapper';
import ErrorScreen from '/src/components/Screen/ErrorScreen';
import collectionViewIds from '/src/components/Collection/collectionViewIds';
import { SinglePane } from '/src/components/common/index.jsx';
import { selectCollection } from '/src/selectors.js';

export class CollectionScreen extends Component {
  render() {
    const { collectionId, collection, activeMode } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.casefile === true) {
      return <Navigate to={`/investigations/${collectionId}`} replace />;
    }

    return (
      <Screen title={collection.label} description={collection.summary}>
        <CollectionWrapper collectionId={collectionId} collection={collection}>
          <SinglePane>
            <CollectionHeading collection={collection} />
            <CollectionViews
              collectionId={collectionId}
              activeMode={activeMode}
            />
          </SinglePane>
        </CollectionWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const activeMode = hashQuery.mode || collectionViewIds.OVERVIEW;

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    activeMode,
  };
};

export default compose(withRouter, connect(mapStateToProps))(CollectionScreen);
