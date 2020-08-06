import _ from 'lodash';
import React from 'react';
import { Button, MenuDivider, Tabs, Tab } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { Count, Schema } from 'components/common';
import EntityListViews from 'components/Entity/EntityListViews';
import { queryCollectionEntities } from 'queries';
import { selectModel } from 'selectors';


class CollectionEntitiesMode extends React.PureComponent {
  render() {
    const { collection, querySchemaEntities, schemaCounts } = this.props;
    return (
      <EntityListViews
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
  injectIntl,
)(CollectionEntitiesMode);
