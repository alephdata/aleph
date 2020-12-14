import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Screen from 'components/Screen/Screen';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import CollectionContextLoader from 'components/Collection/CollectionContextLoader';
import DocumentDropzone from 'components/Document/DocumentDropzone';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { Breadcrumbs, SearchBox } from 'components/common';
import { queryCollectionEntities } from 'queries';
import { selectCollection, selectCollectionStatus } from 'selectors';

const messages = defineMessages({
  placeholder: {
    id: 'collection.search.placeholder',
    defaultMessage: 'Search this dataset',
  },
  placeholder_casefile: {
    id: 'collection.search.placeholder',
    defaultMessage: 'Search this investigation',
  },
});

export class CollectionWrapper extends Component {
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
      location, children, collection, collectionId, activeMode, query, extraBreadcrumbs, intl,
    } = this.props;

    const search = (
      <SearchBox
        onSearch={this.onSearch}
        placeholder={intl.formatMessage(messages[collection.casefile ? 'placeholder_casefile' : 'placeholder'])}
        query={query}
        inputProps={{ disabled: collection.isPending }}
      />
    );

    const operation = <CollectionManageMenu collection={collection} view="collapsed" />;
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
            {children}
          </DocumentDropzone>
        </Screen>
      </CollectionContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { collection, location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const activeMode = hashQuery.mode || collectionViewIds.OVERVIEW;
  const query = queryCollectionEntities(activeMode === 'search' && location, collectionId);

  return {
    collectionId,
    query,
    status: selectCollectionStatus(state, collectionId),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionWrapper);
