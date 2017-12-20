import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NonIdealState, Spinner } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';

import { fetchNextSearchResults } from 'src/actions';

import EntityList from 'src/components/EntityScreen/EntityList';

class SearchResult extends Component {
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
        <EntityList result={result} />
        { result.next && (
            result.isFetchingNext
              ? <div className="results-loading"><Spinner /></div>
              : <Waypoint onEnter={this.bottomReachedHandler.bind(this)} />
        )}
      </div>
    );
  }
}

SearchResult = connect(null, { fetchNextSearchResults })(SearchResult);
export default SearchResult;
