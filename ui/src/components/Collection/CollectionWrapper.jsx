import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import DocumentDropzone from 'components/Document/DocumentDropzone';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { Breadcrumbs, SearchBox } from 'components/common';
import { collectionEntitiesQuery } from 'queries';
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

    history.push({
      pathname: getCollectionLink(collection),
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
      showCategory, children, collection, query, intl, isCasefile
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
        <Breadcrumbs.Collection key="collection" collection={collection} showCategory={showCategory} />
      </Breadcrumbs>
    );

    return (
      <>
        {breadcrumbs}
        <DocumentDropzone
          canDrop={collection.writeable}
          collection={collection}
          onUploadSuccess={this.onUploadSuccess}
        >
          {children}
        </DocumentDropzone>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location, forceCasefile } = ownProps;
  const isCasefile = forceCasefile || collection?.casefile;
  const hashQuery = queryString.parse(location.hash);
  const activeMode = hashQuery.mode;
  const onCollectionScreen = location.pathname === getCollectionLink(collection);
  // only pull from query location when in collection search mode
  const qLocation = onCollectionScreen && activeMode === collectionViewIds.SEARCH && location;
  const query = collectionEntitiesQuery(qLocation, collection?.id);
  const showCategory = !isCasefile && onCollectionScreen;

  return {
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
