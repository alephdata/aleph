import React, { Component } from 'react';
import { NonIdealState } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';

import EntityList from 'src/components/EntityScreen/EntityList';
import SectionLoading from 'src/components/common/SectionLoading';

class SearchResult extends Component {
  render() {
    const { result, hasMoreResults, getMoreResults } = this.props;

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
        { !result.isExpanding && hasMoreResults && (
          <Waypoint
            onEnter={getMoreResults}
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

export default SearchResult;
