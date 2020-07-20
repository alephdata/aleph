import _ from 'lodash';
import React from 'react';
import { Button, MenuDivider, Tabs, Tab } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { Count, Schema } from 'components/common';
import EntityListManager from 'components/Entity/EntityListManager';
import { queryCollectionEntities } from 'queries';
import { selectModel } from 'selectors';

import './CollectionEntitiesMode.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});


class CollectionEntitiesMode extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(type) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = type;

    history.push({
      pathname: location.pathname,
      search: "",
      hash: queryString.stringify(parsedHash),
    });
  }

  renderTable() {
    const { collection, activeSchema } = this.props;
    return <EntityListManager
      collection={collection}
      schema={activeSchema}
      onStatusChange={() => {}}
    />;
  }

  render() {
    const { collection, activeType, schemaViews, selectableSchemata, intl } = this.props;
    const showSchemaSelect = collection.writeable && selectableSchemata.length;

    return (
      <Tabs
        id="CollectionEntitiesModeTabs"
        className="CollectionEntitiesMode__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeType}
        renderActiveTabPanelOnly
        vertical
      >
        {schemaViews.map(ref => (
          <Tab
            id={ref.schema}
            key={ref.schema}
            className="CollectionEntitiesMode__tab"
            title={
              <>
                <Schema.Label schema={ref.schema} plural icon />
                <Count count={ref.count} />
              </>}
            panel={this.renderTable()}
          />
        ))}
        {schemaViews.length > 0 && showSchemaSelect && <MenuDivider />}
        {showSchemaSelect && (
          <Tab
            id="new"
            key="new"
            disabled
            className="CollectionEntitiesMode__tab schema-add-tab"
            title={
              <Schema.Select
                onSelect={this.handleTabChange}
                optionsFilter={schema => selectableSchemata.indexOf(schema.name) !== -1}
              >
                <Button
                  icon="plus"
                  text={intl.formatMessage(messages.addSchemaPlaceholder)}
                />
              </Schema.Select>
            }
          />
        )}
      </Tabs>
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
