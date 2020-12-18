import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { queryCollections } from 'actions';
import { selectCollectionsResult } from 'selectors';
import { ErrorSection, SearchBox, SortingBar, QueryInfiniteLoad } from 'components/common';
import QueryTags from 'components/QueryTags/QueryTags';
import SearchActionBar from 'components/common/SearchActionBar';
import CollectionIndexItem from './CollectionIndexItem';

import './CollectionIndex.scss';


export class CollectionIndex extends Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
  }

  onSearch(queryText) {
    const { query } = this.props;
    const newQuery = query.set('q', queryText);
    this.updateQuery(newQuery);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  renderErrors() {
    const { emptyText, icon, noResultsText, query, result } = this.props;
    const hasQuery = query.hasQuery() || query.hasFilter('creator_id');

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }
    if (result.total === 0) {
      const message = hasQuery ? noResultsText : emptyText;

      return <ErrorSection icon={icon} title={message} />;
    }

    return null;
  }

  renderResults() {
    const { result } = this.props;
    const skeletonItems = [...Array(10).keys()];

    return (
      <ul className="index">
        {result.results.map(
          res => <CollectionIndexItem key={res.id} collection={res} />,
        )}
        {result.isPending && skeletonItems.map(
          item => <CollectionIndexItem key={item} isPending />,
        )}
      </ul>
    );
  }

  render() {
    const { placeholder, query, result, showQueryTags } = this.props;

    return (
      <div className="CollectionIndex">
        <div className="CollectionIndex__controls">
          <SearchBox
            onSearch={this.onSearch}
            placeholder={placeholder}
            query={query}
            inputProps={{ large: true, autoFocus: true }}
          />
          {showQueryTags && (
            <QueryTags query={query} updateQuery={this.updateQuery} />
          )}
          <SearchActionBar result={result}>
            <SortingBar
              query={query}
              updateQuery={this.updateQuery}
              showCreatedByFilter
            />
          </SearchActionBar>
        </div>
        {this.renderErrors()}
        {this.renderResults()}
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.queryCollections}
        />
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
)(CollectionIndex);
