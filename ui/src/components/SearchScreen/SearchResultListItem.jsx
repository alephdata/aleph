import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import Schema from 'src/components/common/Schema';
import getPath from 'src/util/getPath';

const ListItem = ({ name, title, schema, properties, collection, links }) => (
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
      {properties.map(property => (
        <span className="result-property" data-property={property.name} key={property.name}>
          <span className={`pt-icon pt-icon-${property.icon}`} /> {property.label}
        </span>
      ))}
    </td>
  </tr>
);

const SearchResultListItem = ({ result, countries }) => {
  // const schemaProperties = {
  //   'Document': () => [],
  //   'Company': () => [],
  //   'LegalEntity': () => [],
  //   'Land': () => [],
  //   'Person': ({ nationality, address }) => [
  //     {name: 'nationality', icon: 'flag', label: countries[nationality]},
  //     {name: 'address', icon: 'map', label: address}
  //   ]
  // };

  // const properties = schemaProperties[result.schema](result.properties)
  //   .filter(property => !!property.label);

  const properties = [];
  return <ListItem {...result} collection={result.collection} properties={properties} />;
};

const mapStateToProps = ({ metadata }, { result }) => ({
  countries: metadata.countries
});

export default connect(mapStateToProps)(SearchResultListItem);
