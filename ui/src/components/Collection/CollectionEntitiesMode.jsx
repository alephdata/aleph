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
  const { location, activeMode } = ownProps;
  const context = {
    'filter:schema': activeMode
  };
  const query = Query.fromLocation('search', location, context, 'entities');
  return { query };
};


CollectionEntitiesMode = connect(mapStateToProps, {})(CollectionEntitiesMode);
CollectionEntitiesMode = withRouter(CollectionEntitiesMode);
export default CollectionEntitiesMode;
