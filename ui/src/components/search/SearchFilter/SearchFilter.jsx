import React, { Component } from 'react';

import SearchFilterText from './SearchFilterText';
import SearchFilterActiveTags from './SearchFilterActiveTags';

import './SearchFilter.css';

class SearchFilter extends Component {
  render() {
    const { query, aspects, updateQuery } = this.props;

    return (
      <div className="SearchFilter">
        <div className="search-query">
          <div className="search-query__text">
            <SearchFilterText query={query} updateQuery={updateQuery}>
              <SearchFilterActiveTags aspects={aspects}
                                      query={query} updateQuery={updateQuery} />
            </SearchFilterText>
          </div>
        </div>
      </div>
    );
  }
}

export default SearchFilter;