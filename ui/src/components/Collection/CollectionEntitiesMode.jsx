import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';


class CollectionEntitiesMode extends React.PureComponent {
  render() {
    const { collection, editMode, query } = this.props;
    const mutableCollection = collection?.writeable ? true : false;

    return (
      <EntitySearch
        query={query}
        writeable={mutableCollection}
        hideCollection
        showPreview={false}
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
