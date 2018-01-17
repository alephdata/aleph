import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import SearchFilterFacet from './SearchFilterFacet';
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
            <SearchFilterText query={query} updateQuery={updateQuery} />
          </div>
          {aspects.countries && (
            <div className="pt-large">
              <SearchFilterFacet query={query} updateQuery={updateQuery} field='countries'>
                <FormattedMessage id="search.countries" defaultMessage="Countries"/>
              </SearchFilterFacet>
            </div>
          )}
          {aspects.collections && (
            <div className="pt-large">
              <SearchFilterFacet query={query} updateQuery={updateQuery} field='collection_id'>
                <FormattedMessage id="search.collections" defaultMessage="Collections"/>
              </SearchFilterFacet>
            </div>
          )}
        </div>
        <SearchFilterSchema query={query} updateQuery={updateQuery} result={result} />
        <SearchFilterActiveTags aspects={aspects} query={query} updateQuery={updateQuery} />
      </div>
    );
  }
}

export default SearchFilter;
