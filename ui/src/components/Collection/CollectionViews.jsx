import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, ResultCount } from 'components/common';
import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionMappingsMode from 'components/Collection/CollectionMappingsMode';
import CollectionEntitiesMode from 'components/Collection/CollectionEntitiesMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import collectionViewIds from 'components/Collection/collectionViewIds';
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
          title={
            <>
              <Icon icon="grouped-bar-chart" className="left-icon" />
              <FormattedMessage id="entity.info.overview" defaultMessage="Overview" />
            </>}
          panel={<CollectionOverviewMode collection={collection} />}
        />
        {showDocumentsTab && (
          <Tab
            id={collectionViewIds.DOCUMENTS}
            className="CollectionViews__tab"
            title={
              <>
                <Icon icon="document" className="left-icon" />
                <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                <Count count={documentTabCount} />
              </>}
            panel={<CollectionDocumentsMode collection={collection} />}
          />
        )}
        {isCasefile && (
          <Tab
            id={collectionViewIds.ENTITIES}
            className="CollectionViews__tab"
            title={
              <>
                <Icon icon="list-columns" className="left-icon" />
                <FormattedMessage id="entity.info.entities" defaultMessage="Entities" />
                <Count count={entitiesTabCount} />
              </>}
            panel={<CollectionEntitiesMode collection={collection} />}
          />
        )}
        {isCasefile && (
          <Tab
            id={collectionViewIds.DIAGRAMS}
            className="CollectionViews__tab"
            title={
              <>
                <Icon className="left-icon" icon="graph" />
                <FormattedMessage id="collection.info.diagrams" defaultMessage="Network diagrams" />
                <Count count={collection?.counts?.entitysets?.diagram} />
              </>
            }
            panel={<CollectionEntitySetsIndexMode collection={collection} type="diagram" />}
          />
        )}
        {isCasefile && (
          <Tab
            id={collectionViewIds.LISTS}
            className="CollectionViews__tab"
            title={
              <>
                <Icon className="left-icon" icon="list" />
                <FormattedMessage id="collection.info.lists" defaultMessage="Lists" />
                <Count count={collection?.counts?.entitysets?.list} />
              </>
            }
            panel={<CollectionEntitySetsIndexMode collection={collection} type="list" />}
          />
        )}
        {isCasefile && (
          <Tab
            id={collectionViewIds.MAPPINGS}
            className="CollectionViews__tab"
            title={
              <>
                <Icon className="left-icon" icon="new-object" />
                <FormattedMessage id="collection.info.mappings" defaultMessage="Entity mappings" />
                <Count count={collection?.counts?.mappings} />
              </>
            }
            panel={<CollectionMappingsMode collection={collection} />}
          />
        )}
        <Tab
          id={collectionViewIds.XREF}
          className="CollectionViews__tab"
          title={
            <>
              <Icon className="left-icon" icon="comparison" />
              <FormattedMessage id="entity.info.xref" defaultMessage="Cross-reference" />
              <ResultCount result={xref} />
            </>}
          panel={<CollectionXrefMode collection={collection} />}
        />
        <Tab
          id={collectionViewIds.SEARCH}
          className="CollectionViews__tab"
          title={collectionViewIds.SEARCH === activeMode && (
            <>
              <Icon className="left-icon" icon="search" />
              <FormattedMessage id="entity.info.search" defaultMessage='Search: "{qText}"' values={{ qText: searchQuery?.getString('q') }} />
            </>
          )}
          panel={<FacetedEntitySearch query={searchQuery} result={searchResult} />}
        />
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const model = selectModel(state);
  const xrefQuery = queryCollectionXrefFacets(location, collection.id);
  const searchQuery = queryCollectionEntities(location, collection.id);
  const schemata = collection?.statistics?.schema?.values;
  let documentTabCount, entitiesTabCount;

  if (schemata) {
    documentTabCount = 0;
    entitiesTabCount = 0;

    for (const key in schemata) {
      const schema = model.getSchema(key);
      if (schema.isDocument()) {
        documentTabCount += schemata[key];
      }
      if (!(schema.isDocument() || schema.hidden)) {
        entitiesTabCount += schemata[key];
      }
    }
  }

  return {
    entitiesTabCount: entitiesTabCount,
    documentTabCount: documentTabCount,
    isCasefile: collection.casefile,
    showDocumentsTab: (documentTabCount > 0 || collection.writeable),
    xref: selectCollectionXrefResult(state, xrefQuery),
    searchQuery,
    searchResult: selectEntitiesResult(state, searchQuery)
  };
};

CollectionViews = connect(mapStateToProps, {})(CollectionViews);
CollectionViews = injectIntl(CollectionViews);
CollectionViews = withRouter(CollectionViews);
export default CollectionViews;
