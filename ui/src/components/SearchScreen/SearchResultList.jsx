import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NonIdealState, Spinner } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';

import { fetchNextSearchResults } from 'src/actions';

import SearchResultListItem from './SearchResultListItem';

import './SearchResultList.css';

class SearchResultList extends Component {
  bottomReachedHandler() {
    const { result, fetchNextSearchResults } = this.props;
    if (result.next) {
      fetchNextSearchResults({ next: result.next });
    }
  }

  render() {
    const { result } = this.props;

    return (
      <div>
        { !result.isFetching && result.results.length === 0 &&
          <NonIdealState visual="search" title="No search results"
            description="Try making your search more general" />}
        <table className="results-table pt-table pt-striped">
          <tbody>
            {result.results.map(item => <SearchResultListItem key={item.id} result={item} />)}
          </tbody>
        </table>
        { result.next && (
            result.isFetchingNext
              ? <div className="results-loading"><Spinner /></div>
              : <Waypoint onEnter={this.bottomReachedHandler.bind(this)} />
        )}
      </div>
    );
  }
}

SearchResultList = connect(null, { fetchNextSearchResults })(SearchResultList);

export default SearchResultList;
