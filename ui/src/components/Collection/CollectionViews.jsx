import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, ResultCount } from 'src/components/common';
import CollectionOverviewMode from 'src/components/Collection/CollectionOverviewMode';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'src/components/Collection/CollectionEntitiesMode';
import CollectionXrefMode from 'src/components/Collection/CollectionXrefMode';
import CollectionDiagramsIndexMode from 'src/components/Collection/CollectionDiagramsIndexMode';
import collectionViewIds from 'src/components/Collection/collectionViewIds';
import { queryCollectionDiagrams, queryCollectionXrefFacets } from 'src/queries';
import { selectModel, selectDiagramsResult, selectCollectionXrefResult } from 'src/selectors';

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
      collection, activeMode, diagrams, xref,
      showDiagramsTab, showEntitiesTab, showDocumentsTab,
      documentTabCount, entitiesTabCount
    } = this.props;

    console.log('doc tab count', documentTabCount, entitiesTabCount);
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
        {showEntitiesTab && (
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
        {showDiagramsTab && (
          <Tab
            id={collectionViewIds.DIAGRAMS}
            className="CollectionViews__tab"
            title={
              <>
                <Icon className="left-icon" icon="graph" />
                <FormattedMessage id="collection.info.diagrams" defaultMessage="Network diagrams" />
                <ResultCount result={diagrams} />
              </>
            }
            panel={<CollectionDiagramsIndexMode collection={collection} />}
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
      </Tabs>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const model = selectModel(state);
  const diagramsQuery = queryCollectionDiagrams(location, collection.id);
  const xrefQuery = queryCollectionXrefFacets(location, collection.id);
  const schemata = collection?.statistics?.schema?.values || [];
  let documentTabCount = 0, entitiesTabCount = 0;
  for (const key in schemata) {
    const schema = model.getSchema(key);
    if (schema.isDocument()) {
      documentTabCount += schemata[key];
    }
    if (!(schema.isDocument() || schema.isA('Page'))) {
      entitiesTabCount += schemata[key];
    }
  }

  return {
    entitiesTabCount: entitiesTabCount,
    documentTabCount: documentTabCount,
    showDiagramsTab: collection.casefile,
    showEntitiesTab: collection.casefile,
    showDocumentsTab: (documentTabCount > 0 || collection.writeable),
    xref: selectCollectionXrefResult(state, xrefQuery),
    diagrams: selectDiagramsResult(state, diagramsQuery),
  };
};

CollectionViews = connect(mapStateToProps, {})(CollectionViews);
CollectionViews = injectIntl(CollectionViews);
CollectionViews = withRouter(CollectionViews);
export default CollectionViews;
