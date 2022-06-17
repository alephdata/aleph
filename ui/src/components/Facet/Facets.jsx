// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
