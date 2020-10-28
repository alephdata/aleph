import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, ResultCount } from 'components/common';
import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'components/Collection/CollectionEntitiesMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { queryCollectionEntitySets, queryCollectionXrefFacets } from 'queries';
import { selectModel, selectEntitySetsResult, selectCollectionXrefResult } from 'selectors';

// import './InvestigationViews.scss';

class InvestigationViews extends React.Component {
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
      collection, activeMode, diagrams, lists, xref,
      showDocumentsTab,
      documentTabCount, entitiesTabCount
    } = this.props;

    return (
      <Tabs
        id="CollectionInfoTabs"
        className="InvestigationViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeMode}
        renderActiveTabPanelOnly
      >
        <Tab
          id={collectionViewIds.OVERVIEW}
          className="InvestigationViews__tab"
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
            className="InvestigationViews__tab"
            title={
              <>
                <Icon icon="document" className="left-icon" />
                <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                <Count count={documentTabCount} />
              </>}
            panel={<CollectionDocumentsMode collection={collection} />}
          />
        )}

        <Tab
          id={collectionViewIds.ENTITIES}
          className="InvestigationViews__tab"
          title={
            <>
              <Icon icon="list-columns" className="left-icon" />
              <FormattedMessage id="entity.info.entities" defaultMessage="Entities" />
              <Count count={entitiesTabCount} />
            </>}
          panel={<CollectionEntitiesMode collection={collection} />}
        />

        <Tab
          id={collectionViewIds.DIAGRAMS}
          className="InvestigationViews__tab"
          title={
            <>
              <Icon className="left-icon" icon="graph" />
              <FormattedMessage id="collection.info.diagrams" defaultMessage="Network diagrams" />
              <ResultCount result={diagrams} />
            </>
          }
          panel={<CollectionEntitySetsIndexMode collection={collection} type="diagram" />}
        />

        <Tab
          id={collectionViewIds.LISTS}
          className="InvestigationViews__tab"
          title={
            <>
              <Icon className="left-icon" icon="list" />
              <FormattedMessage id="collection.info.lists" defaultMessage="Lists" />
              <ResultCount result={lists} />
            </>
          }
          panel={<CollectionEntitySetsIndexMode collection={collection} type="list" />}
        />
        <Tab
          id={collectionViewIds.XREF}
          className="InvestigationViews__tab"
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
  const diagramsQuery = queryCollectionEntitySets(location, collection.id).setFilter('type', 'diagram');
  const listsQuery = queryCollectionEntitySets(location, collection.id).setFilter('type', 'list');
  const xrefQuery = queryCollectionXrefFacets(location, collection.id);
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
    showDocumentsTab: (documentTabCount > 0 || collection.writeable),
    xref: selectCollectionXrefResult(state, xrefQuery),
    diagrams: selectEntitySetsResult(state, diagramsQuery),
    lists: selectEntitySetsResult(state, listsQuery),
  };
};

InvestigationViews = connect(mapStateToProps, {})(InvestigationViews);
InvestigationViews = injectIntl(InvestigationViews);
InvestigationViews = withRouter(InvestigationViews);
export default InvestigationViews;
