import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import SearchFilterFacet from './SearchFilterFacet';

import './SearchFilterFacets.css';

class SearchFilterFacets extends Component {
  render() {
    const { query, aspects, updateQuery } = this.props;

    return (
      <div className="SearchFilterFacets">
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
    );
  }
}

export default SearchFilterFacets;
