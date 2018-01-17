import React, { Component } from 'react';

import SearchFilterCollectionTag from './SearchFilterCollectionTag';
import SearchFilterCountryTag from './SearchFilterCountryTag';

class SearchFilterActiveTags extends Component {
  constructor(props) {
    super(props);
    this.removeCollection = this.removeCollection.bind(this);
    this.removeCountry = this.removeCountry.bind(this);
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
    const { query, aspects } = this.props;
    const selectedCountries = aspects.countries && query.getFilter('countries');
    const selectedCollections = aspects.collections && query.getFilter('collection_id');
    const hasActiveFilters = (
      (selectedCountries && selectedCountries.length > 0) ||
      (selectedCollections && selectedCollections.length > 0)
    );

    if (!hasActiveFilters) {
      return null;
    }

    return (
      <div className="search-query__active-filters">
        {selectedCountries.map(countryCode => (
          <SearchFilterCountryTag
            countryCode={countryCode}
            removeCountry={this.removeCountry}
            key={countryCode}
          />
        ))}
        {selectedCollections.map(collectionId => (
          <SearchFilterCollectionTag
            collectionId={collectionId}
            removeCollection={this.removeCollection}
            key={collectionId}
          />
        ))}
      </div>
    );
  }
}

export default SearchFilterActiveTags;
