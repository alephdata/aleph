import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import DocumentManager from 'components/Document/DocumentManager';
import { queryCollectionMappings } from 'queries';
import { selectMappingsResult } from 'selectors';



class CollectionMappingsMode extends React.Component {
  render() {
    const { collection, result } = this.props;
    console.log('result', result)
    return null;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const query = queryCollectionMappings(location, collection.id);

  return {
    result: selectMappingsResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionMappingsMode);
