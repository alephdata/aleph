import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Waypoint } from 'react-waypoint';

import { queryCollections } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import {
  ErrorSection, SectionLoading, SortingBar,
} from 'src/components/common';
import QueryTags from 'src/components/QueryTags/QueryTags';
import CollectionIndexItem from './CollectionIndexItem';
import CollectionIndexSearch from './CollectionIndexSearch';

import './CollectionIndex.scss';

const messages = defineMessages({
  sort_created_at: {
    id: 'collection.index.sort.created_at',
    defaultMessage: 'Creation Date',
  },
  sort_updated_at: {
    id: 'collection.index.sort.updated_at',
    defaultMessage: 'Update Date',
  },
  sort_count: {
    id: 'collection.index.sort.count',
    defaultMessage: 'Size',
  },
  sort_label: {
    id: 'collection.index.sort.label',
    defaultMessage: 'Title',
  },
  no_results: {
    id: 'collection.index.no_results',
    defaultMessage: 'No datasets were found matching this search',
  },
});

export class CollectionIndex extends Component {
  constructor(props) {
    super(props);

    this.onSort = this.onSort.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  onSort({ field, direction }) {
    const { query, sortDirection, sortField } = this.props;
    const newQuery = query.sortBy(field || sortField, direction || sortDirection);
    this.updateQuery(newQuery);
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryCollections({ query, result, next: result.next });
    }
  }

  getSortingOptions() {
    const { intl } = this.props;
    return [
      { field: 'created_at', label: intl.formatMessage(messages.sort_created_at) },
      { field: 'count', label: intl.formatMessage(messages.sort_count) },
      { field: 'label', label: intl.formatMessage(messages.sort_label) },
      { field: 'updated_at', label: intl.formatMessage(messages.sort_updated_at) },
    ];
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  renderErrors() {
    const { emptyText, intl, query, result } = this.props;
    const hasQuery = query.hasQuery();

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }
    if (result.total === 0) {
      if (hasQuery) {
        return <ErrorSection icon="shield" title={intl.formatMessage(messages.no_results)} />;
      }

      return <ErrorSection icon="shield" title={emptyText} />;
    }

    return null;
  }

  renderResults() {
    const { result } = this.props;

    return (
      <>
        <ul className="results">
          {result.results !== undefined && result.results.map(
            res => <CollectionIndexItem key={res.id} collection={res} />,
          )}
        </ul>
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
        {result.isLoading && (
          <Skeleton.Layout
            type="table"
            rowCount={10}
          />
        )}
      </>
    );
  }

  render() {
    const { placeholder, query, showQueryTags, sortField, sortDirection } = this.props;

    const sortingOptions = this.getSortingOptions();
    const activeSort = sortingOptions.filter(({ field }) => field === sortField);

    return (
      <div className="CollectionIndex">
        <div className="CollectionIndex__controls">
          <CollectionIndexSearch
            query={query}
            updateQuery={this.updateQuery}
            placeholder={placeholder}
          />
          <SortingBar
            sortingOptions={sortingOptions}
            onSort={this.onSort}
            activeSort={activeSort.length ? activeSort[0] : sortingOptions[0]}
            activeDirection={sortDirection}
          />
          {showQueryTags && (
            <QueryTags query={query} updateQuery={this.updateQuery} />
          )}
        </div>
        {this.renderErrors()}
        {this.renderResults()}
      </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const { field, direction } = query.getSort();

  return {
    sortField: field,
    sortDirection: direction,
    result: selectCollectionsResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollections }),
  injectIntl,
)(CollectionIndex);
