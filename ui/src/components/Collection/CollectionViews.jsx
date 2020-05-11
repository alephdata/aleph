import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count } from 'src/components/common';
import CollectionOverviewMode from 'src/components/Collection/CollectionOverviewMode';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import CollectionContentViews from 'src/components/Collection/CollectionContentViews';
import CollectionXrefMode from 'src/components/Collection/CollectionXrefMode';
import CollectionDiagramsIndexMode from 'src/components/Collection/CollectionDiagramsIndexMode';
import collectionViewIds from 'src/components/Collection/collectionViewIds';
import { queryCollectionDiagrams, queryCollectionXrefFacets } from 'src/queries';
import { selectModel, selectDiagramsResult, selectCollectionXrefResult, selectTester } from 'src/selectors';

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

  countDocuments() {
    const { collection, model } = this.props;
    const schemata = collection?.statistics?.schema?.values || [];
    let totalCount = 0;
    for (const key in schemata) {
      if (model.getSchema(key).isDocument()) {
        totalCount += schemata[key];
      }
    }
    return totalCount;
  }

  handleTabChange(mode) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = mode;
    delete parsedHash.type;

    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeMode, diagrams, showDiagramsTab, xref,
    } = this.props;
    const docCount = this.countDocuments();
    const entityCount = collection?.count ? collection.count - docCount : null;

    const hasDocMode = (docCount > 0 || collection.writeable);
    const hasEntityMode = (entityCount > 0 || collection.writeable);

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
        {hasDocMode && (
          <Tab
            id={collectionViewIds.DOCUMENTS}
            className="CollectionViews__tab"
            title={
              <>
                <Icon icon="document" className="left-icon" />
                <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                {docCount > 0 && <Count count={docCount} />}
              </>}
            panel={<CollectionDocumentsMode collection={collection} />}
          />
        )}
        {hasEntityMode && (
          <Tab
            id={collectionViewIds.ENTITIES}
            className="CollectionViews__tab"
            title={
              <>
                <Icon icon="list-columns" className="left-icon" />
                <FormattedMessage id="entity.info.entities" defaultMessage="Entities" />
                {entityCount > 0 && <Count count={entityCount} />}
              </>}
            panel={<CollectionContentViews collection={collection} activeMode={activeMode} onChange={this.handleTabChange} />}
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
                <Count count={diagrams.total} />
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
              <Count count={xref.total} />
            </>}
          panel={<CollectionXrefMode collection={collection} />}
        />
      </Tabs>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const diagramsQuery = queryCollectionDiagrams(location, collection.id);
  const xrefQuery = queryCollectionXrefFacets(location, collection.id);

  return {
    model: selectModel(state),
    xref: selectCollectionXrefResult(state, xrefQuery),
    diagrams: selectDiagramsResult(state, diagramsQuery),
    showDiagramsTab: collection.casefile && selectTester(state),
  };
};

CollectionViews = connect(mapStateToProps, {})(CollectionViews);
CollectionViews = injectIntl(CollectionViews);
CollectionViews = withRouter(CollectionViews);
export default CollectionViews;
