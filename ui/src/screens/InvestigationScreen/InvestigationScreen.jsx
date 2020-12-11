import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router';

import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionViews from 'components/Collection/CollectionViews';
import InvestigationWrapper from 'components/Investigation/InvestigationWrapper';
import ErrorScreen from 'components/Screen/ErrorScreen';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { SinglePane } from 'components/common';
import { selectCollection } from 'selectors';

export class CollectionScreen extends Component {
  render() {
    const { collection, activeMode } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (!collection.isPending) {
      const isCasefile = collection.casefile;
      if (!isCasefile) {
        return <Redirect to={`/datasets/${collection.id}`} />;
      }
    }

    return (
      <InvestigationWrapper collection={collection}>
        <CollectionViews
          collection={collection}
          activeMode={activeMode}
          isPreview={false}
        />
      </InvestigationWrapper>
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
