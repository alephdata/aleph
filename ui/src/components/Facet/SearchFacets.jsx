import React from 'react';
import { Facet } from 'components/common';
import SearchFacet from './SearchFacet';

import './SearchFacets.scss';

function SearchFacets(props) {
  const {
    facets, query, result, updateQuery, isCollapsible,
  } = props;
  return (
    <ul className="SearchFacets bp3-large">
      {facets.map(facet => (
        <li className="facet" key={facet}>
          <SearchFacet
            query={query}
            result={result}
            updateQuery={updateQuery}
            field={facet}
            label={<Facet.Label field={facet} />}
            isCollapsible={isCollapsible}
          />
        </li>
      ))}
    </ul>
  );
}

export default SearchFacets;
