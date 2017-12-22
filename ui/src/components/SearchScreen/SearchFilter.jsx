import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { connect } from 'react-redux';
import { size, xor } from 'lodash';

import SearchFilterFacet from './SearchFilterFacet';
import SearchFilterSchema from './SearchFilterSchema';
import SearchFilterText from './SearchFilterText';

import './SearchFilter.css';

class SearchFilter extends Component {
  constructor(props)  {
    super(props);
  }

  render() {
    const { result, query, updateQuery } = this.props;

    return (
      <div className="SearchFilter">
        <div className="search-query">
          <div className="search-query__text">
            <SearchFilterText query={query} updateQuery={updateQuery} />
          </div>
          {this.props.showCountry && (
            <div className="pt-large">
              <SearchFilterFacet query={query} updateQuery={updateQuery} field='countries'>
                <FormattedMessage id="search.countries" defaultMessage="Countries"/>
              </SearchFilterFacet>
            </div>
          )}
          {this.props.showCollection && (
            <div className="pt-large">
              <SearchFilterFacet query={query} updateQuery={updateQuery} field='collection_id'>
                <FormattedMessage id="search.collections" defaultMessage="Collections"/>
              </SearchFilterFacet>
            </div>
          )}
        </div>
        <SearchFilterSchema query={query} updateQuery={updateQuery} result={result} />
      </div>
    );
  }
}

export default SearchFilter;
