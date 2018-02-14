import React, { Component } from 'react';

import SearchFilterFacet from './SearchFilterFacet';

import './SearchFilterFacets.css';

class SearchFilterFacets extends Component {
  render() {
    const { aspects, query, updateQuery } = this.props;

    let possibleFacets = [
      'schema',
      'countries',
      'languages',
      'emails',
      'phones',
      'names',
      'addresses',
      'mime_type',
      'author',
    ];
    if (aspects.collections) {
      possibleFacets = ['collection_id', ...possibleFacets];
    }

    return (
      <ul className="SearchFilterFacets pt-large">
        {possibleFacets.map(filterName => (
          <li className="facet" key={filterName}>
            <SearchFilterFacet
              initiallyOpen={filterName === 'schema' ? true : undefined}
              query={query}
              updateQuery={updateQuery}
              field={filterName}
              key={filterName}
            />
          </li>
        ))}
      </ul>
    );
  }
}

export default SearchFilterFacets;
