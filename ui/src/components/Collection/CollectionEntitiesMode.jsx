import React from 'react';

import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';
import { connectedWithRouter } from 'src/util/enhancers';


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
  const { location, collection, activeMode } = ownProps;
  const context = {
    'filter:schema': activeMode,
    'filter:collection_id': collection.id,
  };
  const query = Query.fromLocation('entities', location, context, 'entities');
  return { query };
};

export default connectedWithRouter({ mapStateToProps })(CollectionEntitiesMode);
