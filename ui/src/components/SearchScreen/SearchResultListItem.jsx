import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import Schema from 'src/components/common/Schema';
import Country from 'src/components/common/Country';
import getPath from 'src/util/getPath';

const ListItem = ({ name, title, schema, collection, links, countries }) => (
  <tr className={`result result--${schema}`}>
    <td className="result__name">
      <Link to={getPath(links.ui)}>
        <Schema.Icon schema={schema} />
        <span title={name}>{ name || title }</span>
      </Link>
    </td>
    <td className="result__collection">
      {collection ?
        <span title={collection.label}>
          <span className="pt-icon pt-icon-globe" /> {collection.label}
        </span> :
        <span className="pt-skeleton">Loading collection</span>}
    </td>
    <td>
      <Country.List codes={ countries } />
    </td>
  </tr>
);

const SearchResultListItem = ({ result, countries }) => {
  return <ListItem {...result} />;
};

const mapStateToProps = ({ metadata }, { result }) => ({
  countries: metadata.countries
});

export default connect(mapStateToProps)(SearchResultListItem);
