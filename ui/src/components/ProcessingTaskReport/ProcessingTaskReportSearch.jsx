import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Callout } from '@blueprintjs/core';
import c from 'classnames';

import { queryProcessingTaskReports } from 'src/actions';
import { selectProcessingTaskReportsResult } from 'src/selectors';
import ProcessingTaskReportTable from 'src/components/ProcessingTaskReport/ProcessingTaskReportTable';
import { SectionLoading, ErrorSection } from 'src/components/common';

import './ProcessingTaskReportSearch.scss';

const messages = defineMessages({
  no_results_title: {
    id: 'report.search.no_results_title',
    defaultMessage: 'No search results',
  },
});

export class ProcessingTaskReportSearch extends Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.props.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && result.next && !result.isLoading && !result.isError) {
      this.props.queryProcessingTaskReports({ query, next: result.next });
    }
  }

  generateFoundText() {
    const { result } = this.props;

    if (result.isLoading || result.total === 0 || !result.facets) {
      return null;
    }

    const text = `Found ${result.total} reports`;

    return (
      <Callout
        icon={null}
        intent="primary"
        className="ProcessingTaskReportSearch__foundText"
      >
        {text}
      </Callout>
    );
  }

  render() {
    const {
      query,
      result,
      intl,
      className,
      updateSelection,
      allSelected,
      toggleSelectAll,
      selection,
      emptyComponent,
    } = this.props;
    const isEmpty = !query.hasQuery();
    const foundText = this.generateFoundText();

    return (
      <div className={c('ProcessingTaskReportSearch', className)}>
        {result.total === 0 && (
          <section className="PartialError">
            {!isEmpty && (
              <ErrorSection
                icon="search"
                title={intl.formatMessage(messages.no_results_title)}
              />
            )}
            {isEmpty && emptyComponent}
          </section>
        )}
        {foundText}
        <ProcessingTaskReportTable
          query={query}
          result={result}
          updateQuery={this.updateQuery}
          updateSelection={updateSelection}
          toggleSelectAll={toggleSelectAll}
          allSelected={allSelected}
          selection={selection}
        />
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
        {result.total === undefined && <SectionLoading />}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const result = selectProcessingTaskReportsResult(state, query);
  return { query, result };
};
export default compose(
  withRouter,
  connect(mapStateToProps, { queryProcessingTaskReports }),
  injectIntl,
)(ProcessingTaskReportSearch);
