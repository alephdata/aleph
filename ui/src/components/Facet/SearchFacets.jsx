import React from 'react';

import SearchFacet from './SearchFacet';

import './SearchFacets.scss';


function SearchFacets(props) {
  const {
    facets, query, result, updateQuery,
  } = props;
  return (
    <ul className="SearchFacets bp3-large">
      {facets.map(facet => (
        <li className="facet" key={facet.field}>
          <SearchFacet
            query={query}
            result={result}
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

export default SearchFacets;
