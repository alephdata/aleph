import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { queryEntitySets } from 'actions';
import { queryCollectionEntitySets } from 'queries';
import { selectEntitySetsResult } from 'selectors';
import { ErrorSection } from 'components/common';
import EntitySetCreateMenu from 'components/EntitySet/EntitySetCreateMenu';
import DiagramList from 'components/Diagram/DiagramList';

export class CollectionDiagramsIndexMode extends Component {
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
    const { collection, result } = this.props;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    return (
      <div>
        <div style={{ marginBottom: '10px' }}>
          <EntitySetCreateMenu collection={collection} type='diagram' />
        </div>
        <DiagramList
          result={result}
          getMoreItems={this.getMoreResults}
          showCollection={false}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const query = queryCollectionEntitySets(location, collection.id).setFilter('type', 'diagram');
  return {
    query,
    result: selectEntitySetsResult(state, query),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntitySets }),
)(CollectionDiagramsIndexMode);
