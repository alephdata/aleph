import React from 'react';

import Schema from 'src/components/common/Schema';
import Country from 'src/components/common/Country';
import Entity from 'src/components/EntityScreen/Entity';

const SearchResultListItem = ({ result }) => (
  <tr className={`result result--${result.schema}`}>
    <td width="5%">
      <Schema.Icon schema={result.schema} />
    </td>
    <td className="result__name">
      <Entity.Link entity={result} />
    </td>
    <td className="result__collection">
      <span title={result.collection.label}>
        <span className="pt-icon pt-icon-globe" /> {result.collection.label}
      </span>
    </td>
    <td>
      <Country.List codes={result.countries} />
    </td>
  </tr>
);

export default SearchResultListItem;
