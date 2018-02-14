import React, { Component } from 'react';

import SearchFilterSchema from './SearchFilterSchema';
import SearchFilterText from './SearchFilterText';
import SearchFilterActiveTags from './SearchFilterActiveTags';

import './SearchFilter.css';

class SearchFilter extends Component {
  render() {
    const { result, query, aspects, updateQuery } = this.props;

    return (
      <div className="SearchFilter">
        <div className="search-query">
          <div className="search-query__text">
            <SearchFilterText query={query} updateQuery={updateQuery}>
              <SearchFilterActiveTags aspects={{...aspects, schema: false}}
                                      query={query} updateQuery={updateQuery} />
            </SearchFilterText>
          </div>
        </div>
        <SearchFilterSchema query={query} updateQuery={updateQuery} result={result} />
      </div>
    );
  }
}

export default SearchFilter;
