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

// import './InvestigationScreen.scss';


export class InvestigationScreen extends Component {
  render() {
    const {
      activeMode, activeSearch, activeType, collection, collectionId,
    } = this.props;

    if (!collection.isPending && !collection.casefile) {
      return <Redirect to={`/datasets/${collectionId}`} />;
    }

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    return (
      <CollectionContextLoader collectionId={collectionId}>
        <Screen
          title={collection.label}
          description={collection.summary}
        >
          <InvestigationWrapper
            collection={collection}
            collectionId={collectionId}
            activeMode={activeMode}
            activeType={activeType}
            activeSearch={activeSearch}
          >
            <InvestigationViews
              collection={collection}
              activeMode={activeMode}
              isPreview={false}
            />
          </InvestigationWrapper>
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
)(InvestigationScreen);
