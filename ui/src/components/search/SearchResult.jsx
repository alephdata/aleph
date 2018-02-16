import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';

import { fetchNextSearchResults } from 'src/actions';

import EntityList from 'src/components/EntityScreen/EntityList';
import SectionLoading from 'src/components/common/SectionLoading';

class SearchResult extends Component {
  constructor(props) {
    super(props);

    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  bottomReachedHandler() {
    const { query, result, fetchNextSearchResults } = this.props;

    if (result.next) {
      fetchNextSearchResults({ query, result });
    }
  }

  render() {
    const { result } = this.props;

    if (result === undefined || result.isFetching) {
      return (
        <SectionLoading />
      );
    }
    return (
      <div>
        { result.total === 0 &&
          <NonIdealState visual="search" title="No search results"
            description="Try making your search more general" />}
        <EntityList {...this.props} result={result} />
        { !result.isExpanding && result.next && (
          <Waypoint
            onEnter={this.bottomReachedHandler}
            bottomOffset="-600px"
            scrollableAncestor={window}
          />
        )}
        { result.isExpanding && (
          <SectionLoading />
        )}
      </div>
    );
    
  }
}

SearchResult = connect(null, { fetchNextSearchResults })(SearchResult);
export default SearchResult;
