import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { queryDiagrams } from 'src/actions';
import { queryCollectionDiagrams } from 'src/queries';
import { selectDiagramsResult } from 'src/selectors';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import DiagramCreateMenu from 'src/components/Diagram/DiagramCreateMenu';
import DiagramList from 'src/components/Diagram/DiagramList';

export class CollectionDiagramsIndexMode extends Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryDiagrams({ query, next: result.next });
    }
  }

  render() {
    const { collection, result } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

    return (
      <div>
        <div style={{ marginBottom: '10px' }}>
          <DiagramCreateMenu collection={collection} />
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
  const query = queryCollectionDiagrams(location, collection.id);
  return {
    query,
    result: selectDiagramsResult(state, query),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { queryDiagrams }),
)(CollectionDiagramsIndexMode);
