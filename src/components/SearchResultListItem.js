import React from 'react';
import { connect } from 'react-redux';

import SchemaIcon from './SchemaIcon';

const ListItem = ({ name, collection, schema }) => (
  <tr className={`result result--${schema}`}>
    <td className="result__name">
      <span className="result__icon">
        <SchemaIcon schemaId={schema} />
      </span>
      { name }
    </td>
    <td className="result__collection">
        { collection ?
            collection.label :
            <span className="pt-skeleton">Loading collection</span>
        }
    </td>
    <td></td>
  </tr>
);

const ListItems = {
  'Document': ListItem,
  'Land': ListItem,
  'Person': ListItem,
  'LegalEntity': ListItem,
  'Company': ListItem
};

const SearchResultListItem = ({ result, collection }) => {
  const ListItem = ListItems[result.schema];
  return <ListItem collection={collection} {...result} />;
};

const mapStateToProps = ({ collections }, { result }) => ({
  collection: collections[result.collection_id]
});

export default connect(mapStateToProps)(SearchResultListItem);
