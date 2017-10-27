import React from 'react';
import { connect } from 'react-redux';

import SchemaIcon from './SchemaIcon';

const ListItem = ({ name, schema, properties, collection }) => (
  <tr className={`result result--${schema}`}>
    <td className="result__name">
      <span className="result__icon">
        <SchemaIcon schemaId={schema} />
      </span>
      <span title={name}>{ name }</span>
    </td>
    <td className="result__collection">
      {collection ?
        <span title={collection.label}>{collection.label}</span> :
        <span className="pt-skeleton">Loading collection</span>}
    </td>
    <td>
      {properties.map(property => (
        <span className="result-property" data-property={property.name} key={property.name}>
          {property.label}
        </span>
      ))}
    </td>
  </tr>
);

const SearchResultListItem = ({ result, collection, countries }) => {
  const schemaProperties = {
    'Document': () => [],
    'Company': () => [],
    'LegalEntity': () => [],
    'Land': () => [],
    'Person': ({ nationality, address }) => [
      {name: 'nationality', label: countries[nationality]},
      {name: 'address', label: address}
    ]
  };

  const properties = schemaProperties[result.schema](result.properties).filter(property => !!property.label);

  return <ListItem {...result} collection={collection} properties={properties} />
};

const mapStateToProps = ({ collections, metadata }, { result }) => ({
  collection: collections.results[result.collection_id],
  countries: metadata.countries
});

export default connect(mapStateToProps)(SearchResultListItem);
