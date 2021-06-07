import React from 'react';
import SearchField from 'components/SearchField/SearchField';
import Facet from './Facet';

import './Facets.scss';

function Facets(props) {
  const {
    facets, query, result, updateQuery, isCollapsible,
  } = props;
  return (
    <ul className="Facets">
      {facets.map(facet => (
        <li className="facet" key={facet.name}>
          <Facet
            query={query}
            result={result}
            updateQuery={updateQuery}
            facet={facet}
            label={<SearchField.Label field={facet} icon />}
            isCollapsible={isCollapsible}
          />
        </li>
      ))}
    </ul>
  );
}

export default Facets;
