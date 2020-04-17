import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import EntityListManager from 'src/components/Entity/EntityListManager';


class CollectionEntitiesMode extends React.PureComponent {
  render() {
    const { collection, editMode, query } = this.props;

    return (
      <EntityListManager
        query={query}
        collection={collection}
        editMode={editMode}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, collection, schema } = ownProps;
  const context = {
    'filter:schema': schema,
    'filter:collection_id': collection.id,
  };
  const query = Query.fromLocation('entities', location, context, 'entities');
  return { query };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionEntitiesMode);
