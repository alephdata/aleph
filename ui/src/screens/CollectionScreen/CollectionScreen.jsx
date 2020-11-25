import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Redirect } from 'react-router-dom';

import Screen from 'components/Screen/Screen';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import CollectionContextLoader from 'components/Collection/CollectionContextLoader';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionViews from 'components/Collection/CollectionViews';
import CollectionMetadataPanel from 'components/Collection/CollectionMetadataPanel';
import InvestigationWrapper from 'components/Investigation/InvestigationWrapper';
import InvestigationViews from 'components/Investigation/InvestigationViews';
import ErrorScreen from 'components/Screen/ErrorScreen';
import LoadingScreen from 'components/Screen/LoadingScreen';
import { Collection, SinglePane, Breadcrumbs } from 'components/common';
import { selectCollection, selectCollectionStatus } from 'selectors';

import './CollectionScreen.scss';


export class CollectionScreen extends Component {
  render() {
    const {
      collection, collectionId, activeMode, extraBreadcrumbs,
    } = this.props;

    if (!collection.isPending && collection.casefile) {
      return <Redirect to={`/investigations/${collectionId}`} />;
    }

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    const operation = (
      <CollectionManageMenu collection={collection} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={collection} showCategory active />
        {extraBreadcrumbs}
      </Breadcrumbs>
    );

    return (
      <CollectionContextLoader collectionId={collectionId}>
        <Screen
          title={collection.label}
          description={collection.summary}
        >
          {breadcrumbs}
          <SinglePane className="CollectionScreen">
            <div className="CollectionScreen__main">
              <CollectionHeading collection={collection} />
              <div>
                <CollectionViews
                  collection={collection}
                  activeMode={activeMode}
                  isPreview={false}
                />
              </div>
            </div>
            <div className="CollectionScreen__secondary">
              <CollectionMetadataPanel collection={collection} />
            </div>
          </SinglePane>
        </Screen>
      </CollectionContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const searchQuery = queryString.parse(location.search);

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    activeMode: hashQuery.mode,
    activeType: hashQuery.type,
    activeSearch: searchQuery,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionScreen);
