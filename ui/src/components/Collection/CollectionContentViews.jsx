import _ from 'lodash';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { MenuDivider, Tabs, Tab } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, Schema, SchemaSelect } from 'src/components/common';
import CollectionEntitiesMode from 'src/components/Collection/CollectionEntitiesMode';
import { selectModel } from 'src/selectors';

import './CollectionContentViews.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});

class CollectionContentViews extends React.Component {
  constructor(props) {
    super(props);

    this.handleTabChange = this.handleTabChange.bind(this);
  }

  schemaViews() {
    const { activeType, collection, model } = this.props;

    const schemata = collection?.statistics?.schema?.values || [];
    const matching = [];
    for (const key in schemata) {
      if (!model.getSchema(key).isDocument()) {
        matching.push({
          schema: key,
          count: schemata[key],
        });
      }
    }
    const existingSchemata = _.reverse(_.sortBy(matching, ['count']));

    if (activeType && !schemata.hasOwnProperty(activeType)) {
      return [...existingSchemata, { schema: activeType, count: 0 }]
    }
    return existingSchemata
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

  render() {
    const { collection, activeType, intl } = this.props;
    const schemaViews = this.schemaViews();
    const selectedTab = activeType || schemaViews[0]?.schema;
    const isPending = collection.isPending && !collection.id;
    const showSchemaSelect = !isPending && collection.writeable;

    return (
      <Tabs
        id="CollectionContentTabs"
        className="CollectionContentViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={selectedTab}
        renderActiveTabPanelOnly
        vertical
      >
        {schemaViews.map(ref => (
          <Tab
            id={ref.schema}
            key={ref.schema}
            className="CollectionContentViews__tab"
            title={
              <>
                <Schema.Label schema={ref.schema} plural icon />
                <Count count={ref.count} />
              </>}
            panel={<CollectionEntitiesMode collection={collection} schema={selectedTab} />}
          />
        ))}
        {schemaViews.length > 0 && showSchemaSelect && <MenuDivider />}
        {showSchemaSelect && (
          <Tab
            id="new"
            key="new"
            disabled
            className="CollectionContentViews__tab schema-add-tab"
            title={
              <SchemaSelect
                placeholder={intl.formatMessage(messages.addSchemaPlaceholder)}
                onSelect={this.handleTabChange}
                optionsFilter={schema => schema.isThing() && !schemaViews.find(item => (item.schema === schema.name))}
              />
            }
          />
        )}
      </Tabs>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);

  return {
    model: selectModel(state),
    activeType: hashQuery.type,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, {}),
  injectIntl,
)(CollectionContentViews);
