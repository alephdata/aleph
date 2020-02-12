import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Callout } from '@blueprintjs/core';
import c from 'classnames';

import { queryReports } from 'src/actions';
import { selectReportsResult } from 'src/selectors';
import ReportTable from 'src/components/ProcessingReport/ReportTable';
import { SectionLoading, ErrorSection } from 'src/components/common';

import './ReportSearch.scss';

const messages = defineMessages({
  no_results_title: {
    id: 'report.search.no_results_title',
    defaultMessage: 'No search results',
  },
});

export class ReportSearch extends Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && result.next && !result.isLoading && !result.isError) {
      this.props.queryReports({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryReports({ query });
    }
  }

  updateQuery(newQuery) {
    const { updateQuery } = this.props;
    if (updateQuery !== undefined) {
      return updateQuery(newQuery);
    }
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
    return undefined;
  }

  generateFoundText() {
    const { result } = this.props;

    if (result.isLoading || result.total === 0
      || !result.facets || !result.facets.collection_id) {
      return null;
    }

    const text = `Found ${result.total} reports`;

    return (
      <Callout icon={null} intent="primary" className="ReportSearch__foundText">
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
      selection,
      emptyComponent,
    } = this.props;
    const isEmpty = !query.hasQuery();
    const foundText = this.generateFoundText();

    return (
      <div className={c('ReportSearch', className)}>
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
        <ReportTable
          query={query}
          result={result}
          updateQuery={this.updateQuery}
          updateSelection={updateSelection}
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
  const result = selectReportsResult(state, query);
  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryReports }),
  injectIntl,
)(ReportSearch);
