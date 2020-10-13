import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { queryEntitySets } from 'actions';
import { queryCollectionEntitySets } from 'queries';
import { selectEntitySetsResult } from 'selectors';
import { ErrorSection } from 'components/common';
import EntitySetCreateMenu from 'components/EntitySet/EntitySetCreateMenu';
import EntitySetIndex from 'components/EntitySet/EntitySetIndex';

export class CollectionEntitySetsIndexMode extends Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isPending && result.next && !result.isError) {
      this.props.queryEntitySets({ query, next: result.next });
    }
  }

  render() {
    const { collection, result, type } = this.props;

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
          result={result}
          getMoreItems={this.getMoreResults}
          showCollection={false}
          type={type}
          loadMoreOnScroll
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location, type } = ownProps;
  const query = queryCollectionEntitySets(location, collection.id).setFilter('type', type);
  return {
    query,
    result: selectEntitySetsResult(state, query),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntitySets }),
)(CollectionEntitySetsIndexMode);
