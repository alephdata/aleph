import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import EntitySearch from 'src/components/EntitySearch/EntitySearch';
import { queryEntitySimilar } from 'src/queries';

class EntitySimilarMode extends Component {
  render() {
    return <EntitySearch query={this.props.query} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location } = ownProps;
  return { query: queryEntitySimilar(location, entity.id) };
};

EntitySimilarMode = connect(mapStateToProps, {})(EntitySimilarMode);
EntitySimilarMode = withRouter(EntitySimilarMode);
export default EntitySimilarMode;
