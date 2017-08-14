import React from 'react';
import { connect } from 'react-redux';

const DocumentListItem = ({ title, collection }) => (
  <tr className="result result--document">
    <td>{ title }</td>
    <td></td>
    <td></td>
  </tr>
);

const PersonListItem = ({ name, collection }) => (
  <tr className="result result--person">
    <td>{ name }</td>
    <td>{ collection && collection.label }</td>
    <td></td>
  </tr>
);

const LegalEntityListItem = ({ name }) => (
  <tr className="result result--legal-entity">
    <td>{ name }</td>
    <td></td>
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
