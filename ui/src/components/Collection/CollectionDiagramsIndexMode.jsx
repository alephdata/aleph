import React, { Component } from 'react';
// import _ from 'lodash';
// import queryString from 'query-string';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Query from 'src/app/Query';
import { SectionLoading } from 'src/components/common';
import { queryDiagrams } from 'src/actions';
import { selectDiagramsResult } from 'src/selectors';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import DiagramCreateButton from 'src/components/Toolbar/DiagramCreateButton';
import DiagramList from 'src/components/Diagram/DiagramList';


// import './CollectionDiagramsIndexMode.scss';

export class CollectionDiagramsIndexMode extends Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    const { result } = this.props;

    console.log('updated', result);

    if (result.shouldLoad && !prevProps.result.shouldLoad) {
      this.fetchIfNeeded();
    }
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryDiagrams({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading) {
      this.props.queryDiagrams({ query });
    }
  }

  render() {
    const { collection, result } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

    return (
      <div>
        <DiagramCreateButton collection={collection} />

        { result.isLoading && (
          <SectionLoading />
        )}
        { !result.isLoading && (
          <DiagramList items={result.results} getMoreItems={this.getMoreResults} />
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
  const query = new Query('diagrams', state, context, '');
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
