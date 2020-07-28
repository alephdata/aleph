import _ from 'lodash';
import React from 'react';
import { Button, MenuDivider, Tabs, Tab } from '@blueprintjs/core';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { Count, Schema } from 'components/common';
import EntityListManager from 'components/Entity/EntityListManager';
import { queryCollectionEntities } from 'queries';
import { selectModel } from 'selectors';

import './EntityListViews.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});


class EntityListViews extends React.PureComponent {
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
        id="EntityListViewsTabs"
        className="EntityListViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeType}
        renderActiveTabPanelOnly
        vertical
      >
        {schemaViews.map(ref => (
          <Tab
            id={ref.schema}
            key={ref.schema}
            className="EntityListViews__tab"
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
            className="EntityListViews__tab schema-add-tab"
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

export default compose(
  withRouter,
  injectIntl,
)(EntityListViews);
