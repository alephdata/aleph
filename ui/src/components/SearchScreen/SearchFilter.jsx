import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Tag } from '@blueprintjs/core';

import Country from 'src/components/common/Country';
import SearchFilterFacet from './SearchFilterFacet';
import SearchFilterSchema from './SearchFilterSchema';
import SearchFilterText from './SearchFilterText';
import SearchFilterCollectionTag from './SearchFilterCollectionTag';

import './SearchFilter.css';

class SearchFilter extends Component {
  constructor(props) {
    super(props);
    this.removeCollection = this.removeCollection.bind(this);
  }
  
  removeCountry(countryCode) {
    const { query, updateQuery } = this.props;
    updateQuery(query.removeFilter('countries', countryCode));
  }

  removeCollection(collectionId) {
    const { query, updateQuery } = this.props;
    updateQuery(query.removeFilter('collection_id', collectionId));
  }

  render() {
    const { result, query, aspects, updateQuery } = this.props;
    const selectedCountries = aspects.countries && query.getFilter('countries');
    const selectedCollections = aspects.collections && query.getFilter('collection_id');
    const hasActiveFilters = (
      (selectedCountries && selectedCountries.length > 0) ||
      (selectedCollections && selectedCollections.length > 0)
    );

    return (
      <div className="SearchFilter">
        <div className="search-query">
          <div className="search-query__text">
            <SearchFilterText query={query} updateQuery={updateQuery} />
          </div>
          {hasActiveFilters && (
            <div className="search-query__active-filters">
              {selectedCountries.map(countryCode => (
                <Tag
                  className="pt-large"
                  onRemove={() => this.removeCountry(countryCode)}
                  key={countryCode}
                >
                  <Country.Name code={countryCode} />
                </Tag>
              ))}
              {selectedCollections.map(collectionId => (
                <SearchFilterCollectionTag
                  collectionId={collectionId}
                  removeCollection={this.removeCollection}
                  key={collectionId}
                />
              ))}
            </div>
          )}
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
      </div>
    );
  }
}

export default SearchFilter;
