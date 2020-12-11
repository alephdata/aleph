import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, ResultCount } from 'components/common';
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';

import { queryCollectionEntities, queryCollectionXrefFacets } from 'queries';
import { selectModel, selectEntitiesResult, selectCollectionXrefResult } from 'selectors';

import './CollectionViews.scss';

class CollectionViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  componentDidUpdate() {
    const { activeMode } = this.props;
    if (Object.values(collectionViewIds).indexOf(activeMode) < 0) {
      this.handleTabChange(collectionViewIds.OVERVIEW);
    }
  }

  handleTabChange(mode) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = mode;
    delete parsedHash.type;

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeMode, xref,
      isCasefile, showDocumentsTab,
      documentTabCount, entitiesTabCount, searchQuery, searchResult
    } = this.props;

    return (
      <Tabs
        id="CollectionInfoTabs"
        className="CollectionViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeMode}
        renderActiveTabPanelOnly
      >
        <Tab
          id={collectionViewIds.OVERVIEW}
          className="CollectionViews__tab"
          title={(
            <CollectionView.Label id={collectionViewIds.OVERVIEW} icon />
          )}
          panel={<CollectionOverviewMode collection={collection} />}
        />
        {collection.writeable && (
          <Tab
            id={collectionViewIds.DOCUMENTS}
            className="CollectionViews__tab"
            title={
              <>
                <CollectionView.Label id={collectionViewIds.DOCUMENTS} icon />
                <CollectionView.Count id={collectionViewIds.DOCUMENTS} collection={collection} />
              </>}
            panel={<CollectionDocumentsMode collection={collection} />}
          />
        )}
        <Tab
          id={collectionViewIds.XREF}
          className="CollectionViews__tab"
          title={
            <>
              <CollectionView.Label id={collectionViewIds.XREF} icon />
              <CollectionView.Count id={collectionViewIds.XREF} collection={collection} />
            </>}
          panel={<CollectionXrefMode collection={collection} />}
        />
        <Tab
          id={collectionViewIds.SEARCH}
          className="CollectionViews__tab"
          title={collectionViewIds.SEARCH === activeMode && (
            <CollectionView.Label id={collectionViewIds.SEARCH} icon />
          )}
          panel={<FacetedEntitySearch query={searchQuery} result={searchResult} />}
        />
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const searchQuery = queryCollectionEntities(location, collection.id);

  return {
    searchQuery,
    searchResult: selectEntitiesResult(state, searchQuery)
  };
};

CollectionViews = connect(mapStateToProps, {})(CollectionViews);
CollectionViews = injectIntl(CollectionViews);
CollectionViews = withRouter(CollectionViews);
export default CollectionViews;
