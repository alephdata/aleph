import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Screen from 'components/Screen/Screen';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import CollectionContextLoader from 'components/Collection/CollectionContextLoader';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionViews from 'components/Collection/CollectionViews';
import InvestigationWrapper from 'components/Investigation/InvestigationWrapper';
import InvestigationViews from 'components/Investigation/InvestigationViews';


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

  renderInvestigation() {
    const { activeMode, activeSearch, activeType, collection, collectionId } = this.props;

    return (
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
    )

    // return (
    //   <DocumentDropzone
    //     canDrop={collection.writeable}
    //     collection={collection}
    //     onUploadSuccess={this.onUploadSuccess}
    //   >
    //     <SinglePane>
    //       <CollectionHeading collection={collection} />
    //       <div>
    //         <InvestigationViews
    //           collection={collection}
    //           activeMode={activeMode}
    //           isPreview={false}
    //         />
    //       </div>
    //     </SinglePane>
    //   </DocumentDropzone>
    // );
  }

  renderCollection() {
    const { collection, activeMode, extraBreadcrumbs } = this.props;

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
      <>
        {breadcrumbs}
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
      </>
    );
  }

  render() {
    const {
      collection, collectionId, activeMode,
    } = this.props;
    const isInvestigation = collection.casefile;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    const searchScope = {
      listItem: <Collection.Label collection={collection} icon truncate={30} />,
      label: collection.label,
      onSearch: this.onSearch,
    };


    const content = isInvestigation ? this.renderInvestigation() : this.renderCollection();

    return (
      <CollectionContextLoader collectionId={collectionId}>
        <Screen
          title={collection.label}
          description={collection.summary}
          searchScopes={!isInvestigation && [searchScope]}
        >
          {content}
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
    activeMode: hashQuery.mode || collectionViewIds.OVERVIEW,
    activeType: hashQuery.type,
    activeSearch: searchQuery,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionScreen);
