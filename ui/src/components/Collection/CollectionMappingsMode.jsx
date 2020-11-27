import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import DocumentManager from 'components/Document/DocumentManager';
import { queryCollectionMappings } from 'queries';
import MappingIndex from 'components/MappingIndex/MappingIndex';


class CollectionMappingsMode extends React.Component {
  render() {
    const { collection, query } = this.props;
    return <MappingIndex query={query} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  return {
    query: queryCollectionMappings(location, collection.id),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionMappingsMode);
