// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';

import withRouter from 'app/withRouter'
import Screen from 'components/Screen/Screen';
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
      return <Navigate to={`/investigations/${collectionId}`} replace />;
    }

    return (
      <Screen
        title={collection.label}
        description={collection.summary}
      >
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


export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionScreen);
