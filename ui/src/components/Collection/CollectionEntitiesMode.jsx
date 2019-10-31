import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';


class CollectionEntitiesMode extends React.PureComponent {
  render() {
    console.log('IN COLELCTION ENTITES MODE');
    const { query } = this.props;
    return (
      <EntitySearch
        query={query}
        hideCollection
        showPreview={false}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, collection, activeMode } = ownProps;
  const context = {
    'filter:schema': activeMode,
    'filter:collection_id': collection.id,
  };
  const query = Query.fromLocation('entities', location, context, 'entities');
  return { query };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionEntitiesMode);
