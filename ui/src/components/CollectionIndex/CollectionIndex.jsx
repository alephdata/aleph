import React, { Component } from 'react';
import {
  defineMessages,
  // FormattedMessage,
  injectIntl,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Waypoint } from 'react-waypoint';
import { ControlGroup } from '@blueprintjs/core';

// import Query from 'src/app/Query';
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
    defaultMessage: 'Creation date',
  },
  sort_updated_at: {
    id: 'collection.index.sort.updated_at',
    defaultMessage: 'Last update date',
  },
  sort_count: {
    id: 'collection.index.sort.count',
    defaultMessage: 'Size',
  },
  sort_label: {
    id: 'collection.index.sort.label',
    defaultMessage: 'Title',
  },
  sort_score: {
    id: 'collection.index.sort.score',
    defaultMessage: 'Relevance',
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
    console.log('new sort is', field);
    const { query } = this.props;
    const { field: currentField, direction: currentDirection } = query.getSort();

    const newQuery = query.sortBy(field || currentField, direction || currentDirection);
    this.updateQuery(newQuery);
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryCollections({ query, result, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  render() {
    const {
      intl,
      noResultsText,
      placeholder,
      query,
      result,
      showQueryTags,
      sortField,
      sortDirection,
    } = this.props;

    const sortingOptions = [
      { field: 'created_at', label: intl.formatMessage(messages.sort_created_at) },
      { field: 'updated_at', label: intl.formatMessage(messages.sort_updated_at) },
      { field: 'count', label: intl.formatMessage(messages.sort_count) },
      { field: 'label', label: intl.formatMessage(messages.sort_label) },
      { field: 'score', label: intl.formatMessage(messages.sort_score) },
    ];

    const activeSort = sortingOptions.filter(({ field }) => field === sortField);

    return (
      <div className="CollectionIndex">
        <ControlGroup className="CollectionIndex__controls">
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
        </ControlGroup>
        {showQueryTags && (
          <QueryTags query={query} updateQuery={this.updateQuery} />
        )}
        {result.isError && (
          <ErrorSection error={result.error} />
        )}
        {result.total === 0 && (
          <ErrorSection
            icon="shield"
            title={noResultsText}
          />
        )}
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
          <SectionLoading />
        )}
      </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const { field, direction } = query.getSort();

  console.log('in map state to props');
  console.log(query, query.getSort());

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
