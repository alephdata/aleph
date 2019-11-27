import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Card } from '@blueprintjs/core';

import Screen from 'src/components/Screen/Screen';
import CollectionManageMenu from 'src/components/Collection/CollectionManageMenu';
import CollectionContextLoader from 'src/components/Collection/CollectionContextLoader';
import CollectionHeading from 'src/components/Collection/CollectionHeading';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import CollectionViews from 'src/components/Collection/CollectionViews';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { Collection, SinglePane, Breadcrumbs } from 'src/components/common';
import { selectCollection, selectCollectionStatus, selectCollectionView } from 'src/selectors';

import 'src/components/common/ItemOverview.scss';


export class CollectionScreen extends Component {
  constructor(props) {
    super(props);
    this.onSearch = this.onSearch.bind(this);
  }

  onSearch(queryText) {
    const { history, collection } = this.props;
    const query = {
      q: queryText,
      'filter:collection_id': collection.id,
    };
    history.push({
      pathname: '/search',
      search: queryString.stringify(query),
    });
  }

  render() {
    const {
      collection, collectionId, activeMode,
    } = this.props;
    const { extraBreadcrumbs } = this.props;

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

    const searchScope = {
      listItem: <Collection.Label collection={collection} icon truncate={30} />,
      label: collection.label,
      onSearch: this.onSearch,
    };

    const operation = (
      <CollectionManageMenu collection={collection} />
    );

    const active = activeMode !== 'xref';
    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={collection} showCategory active={active} />
        {activeMode === 'xref' && (
          <Breadcrumbs.Text icon="search-around" active>
            <FormattedMessage
              id="collections.xref.title"
              defaultMessage="Cross-reference"
            />
          </Breadcrumbs.Text>
        )}
        {extraBreadcrumbs}
      </Breadcrumbs>
    );

    return (
      <CollectionContextLoader collectionId={collectionId}>
        <Screen
          title={collection.label}
          description={collection.summary}
          searchScopes={[searchScope]}
        >
          {breadcrumbs}
          <SinglePane itemScope itemType="https://schema.org/Dataset">
            <Card elevation={1} className="ItemOverview horizontal">
              <div className="ItemOverview__heading">
                <div className="ItemOverview__heading__centered-container">
                  <CollectionHeading collection={collection} />
                </div>
              </div>
              <div className="ItemOverview__content">
                <CollectionInfoMode collection={collection} />
              </div>
            </Card>
            <CollectionViews
              collection={collection}
              activeMode={activeMode}
              isPreview={false}
            />
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

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    activeMode: selectCollectionView(state, collectionId, hashQuery.mode),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionScreen);
