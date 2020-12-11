import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router';

import Screen from 'components/Screen/Screen';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import CollectionContextLoader from 'components/Collection/CollectionContextLoader';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionViews from 'components/Collection/CollectionViews';
import ErrorScreen from 'components/Screen/ErrorScreen';
import DocumentDropzone from 'components/Document/DocumentDropzone';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { Breadcrumbs, SearchBox, SinglePane } from 'components/common';
import { queryCollectionEntities } from 'queries';
import { selectCollection, selectCollectionStatus } from 'selectors';

const messages = defineMessages({
  placeholder: {
    id: 'collection.search.placeholder',
    defaultMessage: 'Search this dataset',
  },
  placeholder_casefile: {
    id: 'collection.search.placeholder',
    defaultMessage: 'Search this personal dataset',
  },
});

export class CollectionScreen extends Component {
  constructor(props) {
    super(props);

    this.onUploadSuccess = this.onUploadSuccess.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  onSearch(queryText) {
    const { history, location, query } = this.props;

    const newQuery = query.set('q', queryText);

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify({ mode: 'search' }),
      search: newQuery.toLocation()
    });
  }

  onUploadSuccess() {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = collectionViewIds.DOCUMENTS;
    delete parsedHash.type;

    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, collectionId, activeMode, query, extraBreadcrumbs, intl,
    } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (!collection.isPending) {
      const isCasefile = collection.casefile;
      const pathPrefix = location.pathname.split('/')[1];
      if (isCasefile && pathPrefix === 'datasets') {
        return <Redirect to={`/investigations/${collectionId}`} />;
      } else if (!isCasefile && pathPrefix === 'investigations') {
        return <Redirect to={`/datasets/${collectionId}`} />;
      }
    }

    const search = (
      <SearchBox
        onSearch={this.onSearch}
        placeholderd={intl.formatMessage(messages[collection.casefile ? 'placeholder_casefile' : 'placeholder'])}
        query={query}
        inputProps={{ disabled: collection.isPending }}
      />
    );

    const operation = collection.writeable && (
      <CollectionManageMenu collection={collection} view="collapsed" />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation} search={search}>
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
          <DocumentDropzone
            canDrop={collection.writeable}
            collection={collection}
            onUploadSuccess={this.onUploadSuccess}
          >
            <SinglePane>
              <CollectionHeading collection={collection} />
              <div>
                <CollectionViews
                  collection={collection}
                  activeMode={activeMode}
                  isPreview={false}
                />
              </div>
            </SinglePane>
          </DocumentDropzone>
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
  const query = queryCollectionEntities(activeMode === 'search' && location, collectionId);

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    query,
    status: selectCollectionStatus(state, collectionId),
    activeMode,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionScreen);
