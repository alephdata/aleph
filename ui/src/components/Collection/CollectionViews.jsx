import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import Query from 'src/app/Query';

import { Count, TextLoading } from 'src/components/common';
import CollectionOverviewMode from 'src/components/Collection/CollectionOverviewMode';
import CollectionXrefIndexMode from 'src/components/Collection/CollectionXrefIndexMode';
import CollectionDiagramsIndexMode from 'src/components/Collection/CollectionDiagramsIndexMode';
import CollectionProcessingReportViews from 'src/components/Collection/CollectionProcessingReportViews';
import CollectionContentViews from 'src/components/Collection/CollectionContentViews';

import {
  selectCollectionXrefIndex,
  selectModel,
  selectDiagramsResult,
  selectSessionIsTester,
  selectCollectionProcessingReport,
} from 'src/selectors';

import './CollectionViews.scss';

/* eslint-disable */

const viewIds = {
  OVERVIEW: 'overview',
  BROWSE: 'browse',
  XREF: 'xref',
  DIAGRAMS: 'diagrams',
  PROCESSING: 'processing',
};

class CollectionViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  componentDidUpdate() {
    const { activeMode } = this.props;

    if (Object.values(viewIds).indexOf(activeMode) < 0) {
      this.handleTabChange(viewIds.OVERVIEW);
    }
  }

  getEntitySchemata() {
    const { collection, model } = this.props;
    const matching = [];
    for (const key in collection.schemata) {
      if (!model.getSchema(key).isDocument()) {
        matching.push({
          schema: key,
          count: collection.schemata[key],
        });
      }
    }
    return _.reverse(_.sortBy(matching, ['count']));
  }

  countDocuments() {
    const { collection, model } = this.props;
    let totalCount = 0;
    for (const key in collection.schemata) {
      if (model.getSchema(key).isDocument()) {
        totalCount += collection.schemata[key];
      }
    }
    return totalCount;
  }

  countProcessingJobs() {
    const { processingReport } = this.props;
    const { jobs } = processingReport;
    return !!jobs ? jobs.length : 0;
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
      collection,
      activeMode,
      diagrams,
      showDiagramsTab,
      processingReport,
      xrefIndex,
    } = this.props;
    // const numOfDocs = this.countDocuments();
    // const entitySchemata = this.getEntitySchemata();
    const numOfProcessingJobs = this.countProcessingJobs();

    return (
      <Tabs
        id="CollectionInfoTabs"
        className="CollectionViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeMode}
        renderActiveTabPanelOnly
      >
        <Tab
          id={viewIds.OVERVIEW}
          className="CollectionViews__tab"
          title={
            <>
              <Icon icon="grouped-bar-chart" className="left-icon" />
              <FormattedMessage
                id="entity.info.overview"
                defaultMessage="Overview"
              />
            </>
          }
          panel={<CollectionOverviewMode collection={collection} />}
        />
        <Tab
          id={viewIds.BROWSE}
          className="CollectionViews__tab"
          title={
            <>
              <Icon icon="inbox-search" className="left-icon" />
              <FormattedMessage
                id="entity.info.contents"
                defaultMessage="Browse"
              />
            </>
          }
          panel={
            <CollectionContentViews
              collection={collection}
              activeMode={activeMode}
              onChange={this.handleTabChange}
            />
          }
        />
        <Tab
          id={viewIds.XREF}
          className="CollectionViews__tab"
          title={
            <TextLoading loading={xrefIndex.shouldLoad || xrefIndex.isLoading}>
              <Icon className="left-icon" icon="comparison" />
              <FormattedMessage
                id="entity.info.xref"
                defaultMessage="Cross-reference"
              />
              <Count count={xrefIndex.total} />
            </TextLoading>
          }
          panel={<CollectionXrefIndexMode collection={collection} />}
        />
        {showDiagramsTab && (
          <Tab
            id={viewIds.DIAGRAMS}
            className="CollectionViews__tab"
            title={
              <TextLoading loading={diagrams.shouldLoad || diagrams.isLoading}>
                <Icon className="left-icon" icon="graph" />
                <FormattedMessage
                  id="collection.info.diagrams"
                  defaultMessage="Network diagrams"
                />
                <Count count={diagrams.total} />
              </TextLoading>
            }
            panel={<CollectionDiagramsIndexMode collection={collection} />}
          />
        )}
        <Tab
          id={viewIds.PROCESSING}
          className="CollectionViews__tab"
          title={
            <TextLoading loading={processingReport.shouldLoad || processingReport.isLoading}>
              <Icon icon="dashboard" className="left-icon" />
              <FormattedMessage
                id="report.collection.reports"
                defaultMessage="Processing reports"
              />
              <Count count={numOfProcessingJobs} />
            </TextLoading>
          }
          panel={<CollectionProcessingReportViews collection={collection} />}
        />
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;

  const context = {
    'filter:collection_id': collection.id,
  };
  const diagramsQuery = new Query('diagrams', {}, context, 'diagrams').sortBy(
    'updated_at',
    'desc',
  );

  return {
    model: selectModel(state),
    xrefIndex: selectCollectionXrefIndex(state, collection.id),
    diagrams: selectDiagramsResult(state, diagramsQuery),
    processingReport: selectCollectionProcessingReport(state, collection.id),
    showDiagramsTab: collection.casefile && selectSessionIsTester(state),
  };
};

CollectionViews = connect(mapStateToProps, {})(CollectionViews);
CollectionViews = injectIntl(CollectionViews);
CollectionViews = withRouter(CollectionViews);
export default CollectionViews;
