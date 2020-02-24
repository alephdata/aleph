import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Query from 'src/app/Query';
import { SectionLoading } from 'src/components/common';
import { queryDiagrams } from 'src/actions';
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
        { result.isLoading && !result.results?.length && (
          <SectionLoading />
        )}
        { result.results && (
          <DiagramList
            items={result.results}
            getMoreItems={this.getMoreResults}
            showCollection={false}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  const context = {
    'filter:collection_id': collection.id,
  };
  const query = new Query('diagrams', {}, context, 'diagrams')
    .sortBy('updated_at', 'desc');
  const result = selectDiagramsResult(state, query);

  return {
    query,
    result,
  };
};


export default compose(
  connect(mapStateToProps, { queryDiagrams }),
  withRouter,
)(CollectionDiagramsIndexMode);
