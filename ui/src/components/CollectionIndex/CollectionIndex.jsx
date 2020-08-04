import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Waypoint } from 'react-waypoint';

import { queryCollections } from 'actions';
import { selectCollectionsResult } from 'selectors';
import { ErrorSection, SearchBox, SortingBar } from 'components/common';
import QueryTags from 'components/QueryTags/QueryTags';
import CollectionIndexItem from './CollectionIndexItem';

import './CollectionIndex.scss';

const messages = defineMessages({
  no_results: {
    id: 'collection.index.no_results',
    defaultMessage: 'No datasets were found matching this search',
  },
});

export class CollectionIndex extends Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  onSearch(queryText) {
    const { query } = this.props;

    const newQuery = query.set('q', queryText);
    this.updateQuery(newQuery);
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isPending && result.next && !result.isError) {
      this.props.queryCollections({ query, result, next: result.next });
    }
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
    const skeletonItems = [...Array(10).keys()];

    return (
      <>
        <ul className="index">
          {result.results !== undefined && result.results.map(
            res => <CollectionIndexItem key={res.id} collection={res} />,
          )}
          {result.isPending && skeletonItems.map(
            item => <CollectionIndexItem key={item} isPending />,
          )}
        </ul>
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
      </>
    );
  }

  render() {
    const { placeholder, query, showQueryTags, showCreatedByFilter } = this.props;

    return (
      <div className="CollectionIndex">
        <div className="CollectionIndex__controls">
          <SearchBox
            onSearch={this.onSearch}
            placeholder={placeholder}
            query={query}
            inputProps={{ large: true, autoFocus: true }}
          />
          <SortingBar
            query={query}
            updateQuery={this.updateQuery}
            showCreatedByFilter={showCreatedByFilter}
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

  return {
    result: selectCollectionsResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollections }),
  injectIntl,
)(CollectionIndex);
