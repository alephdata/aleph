import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router';

import Screen from 'components/Screen/Screen';
import CollectionContextLoader from 'components/Collection/CollectionContextLoader';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionViews from 'components/Collection/CollectionViews';
import CollectionWrapper from 'components/Collection/CollectionWrapper';
import ErrorScreen from 'components/Screen/ErrorScreen';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { SinglePane } from 'components/common';
import { selectCollection } from 'selectors';


export class CollectionScreen extends Component {
  render() {
    const { collectionId, collection, activeMode } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.casefile === true) {
      return <Redirect to={`/investigations/${collectionId}`} />;
    }

    return (
      <CollectionContextLoader>
        <Screen
          title={collection.label}
          description={collection.summary}
        >
          <CollectionWrapper collection={collection}>
            <SinglePane>
              <CollectionHeading collection={collection} />
              <CollectionViews
                collection={collection}
                activeMode={activeMode}
              />
            </SinglePane>
          </CollectionWrapper>
        </Screen>
      </CollectionContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const activeMode = hashQuery.mode || collectionViewIds.OVERVIEW;

  return {
    collection: selectCollection(state, collectionId),
    activeMode,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionScreen);
