import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import { queryCollectionEntities } from 'queries';
import { selectEntitiesResult } from 'selectors';

const facetKeys = [
  'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes',
];

const CollectionSearchMode = ({ query, result }) => (
  <FacetedEntitySearch
    facets={facetKeys}
    query={query}
    result={result}
  />
)

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const query = queryCollectionEntities(location, collection.id);
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionSearchMode);
