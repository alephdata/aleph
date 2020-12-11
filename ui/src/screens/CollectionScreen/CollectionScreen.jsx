import React, { Component } from 'react';
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
import { Collection, SinglePane, Breadcrumbs } from 'components/common';
import { selectCollection, selectCollectionStatus } from 'selectors';


export class CollectionScreen extends Component {
  constructor(props) {
    super(props);

    this.onUploadSuccess = this.onUploadSuccess.bind(this);
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
      collection, collectionId, activeMode, location,
    } = this.props;
    const { extraBreadcrumbs } = this.props;

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

    const searchScope = {
      listItem: <Collection.Label collection={collection} icon truncate={30} />,
      label: collection.label,
      onSearch: this.onSearch,
    };

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
          searchScopes={[searchScope]}
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

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    activeMode: hashQuery.mode || collectionViewIds.OVERVIEW,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionScreen);
