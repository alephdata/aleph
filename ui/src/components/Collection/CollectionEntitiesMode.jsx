import React from 'react';
import { connect } from "react-redux";
import { withRouter } from 'react-router';

import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';


class CollectionEntitiesMode extends React.Component {
  render() {
    const { query } = this.props;
    return <EntitySearch query={query}
                         hideCollection={true}
                         showPreview={false} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, collection, activeMode } = ownProps;
  const context = {
    'filter:schema': activeMode,
    'filter:collection_id': collection.id
  };
  const query = Query.fromLocation('entities', location, context, 'entities').limit(50);
  return { query };
};


CollectionEntitiesMode = connect(mapStateToProps, {})(CollectionEntitiesMode);
CollectionEntitiesMode = withRouter(CollectionEntitiesMode);
export default CollectionEntitiesMode;
