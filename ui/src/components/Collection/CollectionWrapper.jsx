import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import CollectionContextLoader from 'components/Collection/CollectionContextLoader';
import DocumentDropzone from 'components/Document/DocumentDropzone';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { Breadcrumbs, SearchBox } from 'components/common';
import { collectionSearchQuery } from 'queries';
import { selectCollection } from 'selectors';
import getCollectionLink from 'util/getCollectionLink';


const messages = defineMessages({
  dataset: {
    id: 'collection.search.placeholder',
    defaultMessage: 'Search this dataset',
  },
  casefile: {
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
    const { collection, history, query } = this.props;
    const newQuery = query.set('q', queryText);
    history.push(
      getCollectionLink({ collection, mode: collectionViewIds.SEARCH, search: newQuery.toLocation() })
    );
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
      showCategory, children, collection, collectionId, query, intl, isCasefile
    } = this.props;
    const message = intl.formatMessage(messages[isCasefile ? 'casefile' : 'dataset']);

    const search = (
      <SearchBox
        onSearch={this.onSearch}
        placeholder={message}
        query={query}
        inputProps={{ disabled: !collection?.id }}
      />
    );

    const operation = <CollectionManageMenu collection={collection} />;
    const breadcrumbs = (
      <Breadcrumbs operation={operation} search={search} type={isCasefile ? 'casefile' : 'dataset'}>
        <Breadcrumbs.Collection key="collection" collection={collection} />
      </Breadcrumbs>
    );

    return (
      <CollectionContextLoader collectionId={collectionId}>
        {breadcrumbs}
        <DocumentDropzone
          canDrop={collection.writeable}
          collection={collection}
          onUploadSuccess={this.onUploadSuccess}
        >
          {children}
        </DocumentDropzone>
      </CollectionContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, collectionId: id, location, forceCasefile } = ownProps;
  const collectionId = id || collection?.id;
  const isCasefile = forceCasefile || collection?.casefile;
  const collectionStatus = selectCollection(state, collectionId)?.status;
  const query = collectionSearchQuery(location, collectionId);
  const onCollectionScreen = location.pathname === getCollectionLink(collection);
  const showCategory = !isCasefile && onCollectionScreen;

  return {
    collectionId,
    collection: {...collection, status: collectionStatus},
    isCasefile,
    showCategory,
    query,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionWrapper);
