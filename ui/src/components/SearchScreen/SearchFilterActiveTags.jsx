import React, { Component } from 'react';
import { Tag } from '@blueprintjs/core';

import Country from 'src/components/common/Country';
import SearchFilterCollectionTag from './SearchFilterCollectionTag';

class SearchFilterActiveTags extends Component {
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

    if (!hasActiveFilters) {
      return null;
    }

    return (
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
    );
  }
}

export default SearchFilterActiveTags;
