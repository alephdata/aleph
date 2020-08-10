import _ from 'lodash';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import EntityTableViews from 'components/EntityTable/EntityTableViews';
import { queryCollectionEntities } from 'queries';

class CollectionEntitiesMode extends React.PureComponent {
  render() {
    const { collection, querySchemaEntities, schemaCounts } = this.props;
    return (
      <EntityTableViews
        collection={collection}
        writeable={collection.writeable}
        schemaCounts={schemaCounts}
        querySchemaEntities={querySchemaEntities}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, collection } = ownProps;

  const rawCounts = collection?.statistics?.schema?.values || [];
  const schemaCounts = [];
  for (const key in rawCounts) {
    schemaCounts.push({
      id: key,
      count: rawCounts[key],
    });
  }

  return {
    schemaCounts: _.reverse(_.sortBy(schemaCounts, ['count'])),
    querySchemaEntities: (schema) => queryCollectionEntities(location, collection.id, schema.name),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionEntitiesMode);
