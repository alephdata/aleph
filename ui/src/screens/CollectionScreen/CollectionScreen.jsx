import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import queryString from 'query-string';

import Screen from 'src/components/Screen/Screen';
import CollectionContextLoader from 'src/components/Collection/CollectionContextLoader';
import CollectionToolbar from 'src/components/Collection/CollectionToolbar';
import CollectionHeading from 'src/components/Collection/CollectionHeading';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import CollectionViews from 'src/components/Collection/CollectionViews';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs, SearchBox } from 'src/components/common';
import { selectCollection, selectCollectionView } from 'src/selectors';
import { enhancer } from 'src/util/enhancers';

const messages = defineMessages({
  placeholder: {
    id: 'collections.index.filter',
    defaultMessage: 'Search in {label}',
  },
  xref_title: {
    id: 'collections.xref.title',
    defaultMessage: 'Cross-reference',
  },
});


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    activeMode: selectCollectionView(state, collectionId, hashQuery.mode),
  };
};


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
      intl, collection, collectionId, activeMode,
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

    const operation = (
      <SearchBox
        onSearch={this.onSearch}
        searchPlaceholder={intl.formatMessage(messages.placeholder, { label: collection.label })}
      />
    );
    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={collection} />
        {activeMode === 'xref' && (
          <Breadcrumbs.Text text={intl.formatMessage(messages.xref_title)} />
        )}
        {extraBreadcrumbs}
      </Breadcrumbs>
    );

    return (
      <CollectionContextLoader collectionId={collectionId}>
        <Screen title={collection.label} description={collection.summary}>
          {breadcrumbs}
          <DualPane itemScope itemType="https://schema.org/Dataset">
            <DualPane.ContentPane className="view-menu-flex-direction">
              <CollectionViews
                collection={collection}
                activeMode={activeMode}
                isPreview={false}
              />
            </DualPane.ContentPane>
            <DualPane.InfoPane className="with-heading">
              <CollectionToolbar collection={collection} />
              <CollectionHeading collection={collection} />
              <div className="pane-content">
                <CollectionInfoMode collection={collection} />
              </div>
            </DualPane.InfoPane>
          </DualPane>
        </Screen>
      </CollectionContextLoader>
    );
  }
}

export default enhancer({ mapStateToProps })(CollectionScreen);
