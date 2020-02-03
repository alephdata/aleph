import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';


class CollectionEntitiesMode extends React.PureComponent {
  render() {
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
  const { location, collection, activeType } = ownProps;
  const context = {
    'filter:schema': activeType,
    'filter:collection_id': collection.id,
  };
  const query = Query.fromLocation('entities', location, context, 'entities');
  return { query };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionEntitiesMode);
