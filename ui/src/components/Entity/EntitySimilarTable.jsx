import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import { queryEntities } from 'src/actions/index';
import { selectEntitiesResult } from 'src/selectors';
import { SectionLoading } from 'src/components/common';
import EntityTable from 'src/components/EntityTable/EntityTable';


class EntitySimilarTable extends Component {
  constructor(props) {
    super(props);
    this.fetchData = this.fetchData.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    const { query, result } = this.props;
    if (result.total === undefined && !result.isLoading) {
      this.props.queryEntities({ query });
    }
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next) {
      this.props.queryEntities({ query, next: result.next });
    }
  }

  render() {
    const { query, result } = this.props;
    if (result.total === undefined) {
      return null;
    }
    return (<React.Fragment>
      <EntityTable query={query} result={result} />
      { !result.isLoading && result.next && (
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-600px"
          scrollableAncestor={window}
        />
      )}
      { result.isLoading && (
        <SectionLoading />
      )}
    </React.Fragment>);
  }
}

const mapStateToProps = (state, ownProps) => {
  const { id } = ownProps.entity;
  const path = id ? `entities/${id}/similar` : undefined;
  const query = Query.fromLocation(path, {}, {}, 'similar');
  return {
    query: query,
    result: selectEntitiesResult(state, query)
  }
};

EntitySimilarTable = connect(mapStateToProps, { queryEntities })(EntitySimilarTable);
EntitySimilarTable = withRouter(EntitySimilarTable);
export default EntitySimilarTable;
