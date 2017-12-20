import React from 'react';

import Country from 'src/components/common/Country';
import Schema from 'src/components/common/Schema';
import Collection from 'src/components/common/Collection';
import Entity from 'src/components/EntityScreen/Entity';

const SearchResultListItem = ({ result }) => (
  <tr className={`result result--${result.schema}`}>
    <td className="result__name">
      <Entity.Link entity={result} icon />
    </td>
    <td className="result__collection">
      <Collection.Link collection={result.collection} icon />
    </td>
    <td>
      <Schema.Name schema={result.schema} />
    </td>
    <td>
      <Country.List codes={result.countries} />
    </td>
  </tr>
);

export default SearchResultListItem;
