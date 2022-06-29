{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import { connect } from 'react-redux';
import { Tabs, Tab } from '@blueprintjs/core';
import queryString from 'query-string';

import withRouter from 'app/withRouter'
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { collectionSearchQuery } from 'queries';
import { selectCollection, selectEntitiesResult } from 'selectors';

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
    const { navigate, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = mode;
    delete parsedHash.type;

    navigate({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collectionId, activeMode, searchQuery, searchResult
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
          panel={(
            <CollectionOverviewMode isCasefile={false} collectionId={collectionId} />
          )}
        />
        <Tab
          id={collectionViewIds.DOCUMENTS}
          className="CollectionViews__tab"
          title={
            <>
              <CollectionView.Label id={collectionViewIds.DOCUMENTS} icon isCasefile={false} />
              <CollectionView.Count id={collectionViewIds.DOCUMENTS} collectionId={collectionId} />
            </>}
          panel={<CollectionDocumentsMode collectionId={collectionId} showSearch={false} />}
        />
        <Tab
          id={collectionViewIds.XREF}
          className="CollectionViews__tab"
          title={
            <>
              <CollectionView.Label id={collectionViewIds.XREF} icon />
              <CollectionView.Count id={collectionViewIds.XREF} collectionId={collectionId} />
            </>}
          panel={<CollectionXrefMode collectionId={collectionId} />}
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
  const { collectionId, location } = ownProps;
  const searchQuery = collectionSearchQuery(location, collectionId, { highlight: true });

  return {
    collection: selectCollection(state, collectionId),
    searchQuery,
    searchResult: selectEntitiesResult(state, searchQuery)
  };
};

CollectionViews = connect(mapStateToProps, {})(CollectionViews);
CollectionViews = withRouter(CollectionViews);
export default CollectionViews;
