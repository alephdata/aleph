import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from '/src/app/withRouter.jsx';
import { queryEntitySets } from '/src/actions/index.js';
import { collectionEntitySetsQuery } from '/src/queries.js';
import { selectCollection, selectEntitySetsResult } from '/src/selectors.js';
import { ErrorSection } from '/src/components/common/index.jsx';
import EntitySetCreateMenu from '/src/components/EntitySet/EntitySetCreateMenu';
import EntitySetIndex from '/src/components/EntitySet/EntitySetIndex';

export class CollectionEntitySetsIndexMode extends Component {
  render() {
    const { collection, query, result, type } = this.props;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    return (
      <div>
        {collection.writeable && (
          <div style={{ marginBottom: '20px' }}>
            <EntitySetCreateMenu collection={collection} type={type} />
          </div>
        )}
        <EntitySetIndex
          query={query}
          result={result}
          showCollection={false}
          type={type}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location, type } = ownProps;
  const query = collectionEntitySetsQuery(location, collectionId).setFilter(
    'type',
    type
  );
  return {
    collection: selectCollection(state, collectionId),
    query,
    result: selectEntitySetsResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntitySets })
)(CollectionEntitySetsIndexMode);
