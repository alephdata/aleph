import React, { Component } from 'react';

import SearchFilterTag from './SearchFilterTag';

class SearchFilterActiveTags extends Component {
  constructor(props) {
    super(props);
    this.removeFilterValue = this.removeFilterValue.bind(this);
  }

  removeFilterValue(filter, value) {
    const { query, updateQuery } = this.props;
    updateQuery(query.removeFilter(filter, value));
  }

  render() {
    const { query } = this.props;

    const activeFilters = query.filters();

    if (activeFilters.length === 0) {
      return null;
    }

    // @FIXME This should still selectively display filters for the following:
    // "?exclude={id}"
    // "?parent.id={id}"
    // "?ancestors={id}"
    // …but how the search control works has been refactored and I am having
    // trouble replicating the test cases so coming back to this later.
    // NB: The old URLs for these no longer seem to work with the search 
    // component and now cause errors when called but I'm not sure why yet.
    return (
      <div className="search-query__active-filters">
        {activeFilters.map(filter =>
          query.getFilter(filter).map(value => {
            /*
            return (
              <SearchFilterTag
                filter={filter}
                value={value}
                remove={this.removeFilterValue}
                key={value}
              />
            )
            */
          })
        )}
      </div>
    );
  }
}

export default SearchFilterActiveTags;
