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

    return (
      <div className="search-query__active-filters">
        {activeFilters.map(filter =>
          query.getFilter(filter).map(value => (
            <SearchFilterTag
              filter={filter}
              value={value}
              remove={this.removeFilterValue}
              key={value}
            />
          ))
        )}
      </div>
    );
  }
}

export default SearchFilterActiveTags;
