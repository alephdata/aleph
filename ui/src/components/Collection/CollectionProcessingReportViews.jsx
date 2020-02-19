import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { queryProcessingTaskReports } from 'src/actions';
import { processingTaskReportsQuery } from 'src/queries';
import { selectModel, selectProcessingTaskReportsResult } from 'src/selectors';

import SearchFacets from 'src/components/Facet/SearchFacets';
import ProcessingJobReportMode from 'src/components/ProcessingJobReport/ProcessingJobReportMode';
import ProcessingTaskReportManager from 'src/components/ProcessingTaskReport/ProcessingTaskReportManager';

import './CollectionProcessingReportViews.scss';

/* eslint-disable */
class CollectionProcessingReportViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.state = {
      facets: ['job', 'stage', 'status'],
    };
    this.updateQuery = this.updateQuery.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  handleTabChange(type) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = type;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryProcessingTaskReports({ query });
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
    return undefined;
  }

  render() {
    const { collection, activeType, query, result } = this.props;
    const selectedTab = activeType;
    const showFacets = selectedTab == 'ProcessingTaskReports' && result.total > 0;
    return (
      <Tabs
        id="CollectionProcessingReportTabs"
        className="CollectionProcessingReportViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={selectedTab}
        renderActiveTabPanelOnly
        animate={false}
        vertical
      >
        <Tab
          id="Overview"
          className="CollectionProcessingReportViews__tab"
          title={
            <>
              <Icon icon="heat-grid" className="left-icon" />
              <FormattedMessage
                id="report.info.jobs"
                defaultMessage="Job reports"
              />
            </>
          }
          panel={<ProcessingJobReportMode collection={collection} />}
        />
        <Tab
          id="ProcessingTaskReports"
          className="CollectionProcessingReportViews__tab"
          title={
            <>
              <Icon icon="stacked-chart" className="left-icon" />
              <FormattedMessage
                id="report.info.tasks"
                defaultMessage="Task reports"
              />
            </>
          }
          panel={
            <ProcessingTaskReportManager
              query={query}
              result={result}
              collection={collection}
              updateQuery={this.updateQuery}
            />
          }
        />
        {showFacets && (
          <div className="CollectionProcessingReportViews__facets">
            <SearchFacets
              facets={this.state.facets}
              query={query}
              result={result}
              updateQuery={this.updateQuery}
            />
          </div>
        )}
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const query = processingTaskReportsQuery(location, collection.foreign_id);
  const result = selectProcessingTaskReportsResult(state, query);

  return {
    model: selectModel(state),
    activeType: hashQuery.type,
    query,
    result,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryProcessingTaskReports }),
  injectIntl,
)(CollectionProcessingReportViews);
