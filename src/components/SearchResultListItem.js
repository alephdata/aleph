import React from 'react';
import { connect } from 'react-redux';

const DocumentListItem = ({ title, collection, schema }) => (
  <tr className={`result result--${schema}`}>
    <td>{ title }</td>
    <td className="result__collection">{ collection && collection.label }</td>
    <td></td>
  </tr>
);

const PersonListItem = ({ name, collection, schema }) => (
  <tr className={`result result--${schema}`}>
    <td className="result__name">{ name }</td>
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
  'Document': DocumentListItem,
  'Person': PersonListItem,
  'LegalEntity': PersonListItem,
  'Company': PersonListItem
};

const SearchResultListItem = ({ result, collection }) => {
  const ListItem = ListItems[result.schema];
  return <ListItem collection={collection} {...result} />;
};

const mapStateToProps = ({ collections }, { result }) => ({
  collection: collections[result.collection_id]
});

export default connect(mapStateToProps)(SearchResultListItem);
