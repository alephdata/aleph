import React, { Component } from 'react';

import SearchFacet from './SearchFacet';

import './SearchFacets.css';

class SearchFacets extends Component {
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
      <ul className="SearchFacets pt-large">
        {possibleFacets.map(filterName => (
          <li className="facet" key={filterName}>
            <SearchFacet
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

export default SearchFacets;
