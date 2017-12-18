import React from 'react';
import { Link } from 'react-router-dom';

import Schema from 'src/components/common/Schema';
import Country from 'src/components/common/Country';
import getPath from 'src/util/getPath';

const SearchResultListItem = ({
  result: { name, title, schema, collection, links, countries }
}) => (
  <tr className={`result result--${schema}`}>
    <td width="5%">
      <Schema.Icon schema={schema} />
    </td>
    <td className="result__name">
      <Link to={getPath(links.ui)}>
        <span title={name}>{ name || title }</span>
      </Link>
    </td>
    <td className="result__collection">
      {collection
        ? (
          <span title={collection.label}>
            <span className="pt-icon pt-icon-globe" /> {collection.label}
          </span>
        )
        : <span className="pt-skeleton">Loading collection</span>
      }
    </td>
    <td>
      <Country.List codes={countries} />
    </td>
  </tr>
);

export default SearchResultListItem;
