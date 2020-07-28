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
    return (
      <EntityListViews
        {...this.props}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, collection } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const hashType = hashQuery.type;
  const model = selectModel(state);
  const schemata = model.getSchemata()
    .filter((schema) => !schema.isDocument() && !schema.isA('Page'))
    .map((schema) => schema.name);
  const schemaCounts = collection?.statistics?.schema?.values || [];
  const matching = [];
  for (const key in schemaCounts) {
    if (schemata.indexOf(key) !== -1) {
      matching.push({
        schema: key,
        count: schemaCounts[key],
      });
    }
  }

  const schemaViews = _.reverse(_.sortBy(matching, ['count']));
  if (hashType && !schemaCounts.hasOwnProperty(hashType)) {
    schemaViews.push({ schema: hashType, count: 0 });
  }
  if (!schemaViews.length) {
    schemaViews.push({ schema: 'Person', count: 0 });
  }

  const activeType = hashType || schemaViews[0].schema;
  const selectableSchemata = schemata
    .filter((s) => !schemaViews.find((v) => v.schema === s));
  return {
    activeType: activeType,
    activeSchema: model.getSchema(activeType),
    schemaViews: schemaViews,
    selectableSchemata: selectableSchemata,
    query: queryCollectionEntities(location, collection.id, activeType),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionEntitiesMode);
