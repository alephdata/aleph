import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import { queryCollectionEntities } from 'queries';
import Query from 'app/Query';
import { selectEntitiesResult } from 'selectors';

const facetKeys = [
  'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes',
];


class CollectionSearchMode extends React.Component {
  render() {
    const { collection, query, result } = this.props;
    return (
      <FacetedEntitySearch
        facets={facetKeys}
        query={query}
        result={result}
      />
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const query = queryCollectionEntities(location, collection.id);
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionSearchMode);
