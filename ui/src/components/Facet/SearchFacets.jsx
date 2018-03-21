import React, { Component } from 'react';

import SearchFacet from './SearchFacet';

import './SearchFacets.css';

class SearchFacets extends Component {
  render() {
    const { facets, query, updateQuery } = this.props;
    return (
      <ul className="SearchFacets pt-large">
        {facets.map((facet) => (
          <li className="facet" key={facet.field}>
            <SearchFacet
              query={query}
              updateQuery={updateQuery}
              field={facet.field}
              label={facet.label}
              icon={facet.icon}
              defaultSize={facet.defaultSize}
            />
          </li>
        ))}
      </ul>
    );
  }
}

export default SearchFacets;
