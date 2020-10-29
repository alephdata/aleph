import React from 'react';
import { Button, MenuDivider, Tabs, Tab } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { Count, Schema, SectionLoading, Skeleton } from 'components/common';
import EntityTable from './EntityTable';
import { selectModel } from 'selectors';

import './EntityTableViews.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});


class EntityTableViews extends React.PureComponent {
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
    const { collection, activeSchema, querySchemaEntities, isEntitySet, writeable } = this.props;
    return <EntityTable
      query={querySchemaEntities(activeSchema)}
      collection={collection}
      schema={activeSchema}
      onStatusChange={() => { }}
      writeable={writeable}
      isEntitySet={isEntitySet}
    />;
  }

  render() {
    const { activeSchema, schemaViews, selectableSchemata, intl, isPending, writeable } = this.props;
    const showSchemaSelect = writeable && selectableSchemata.length;

    if (isPending && !activeSchema) {
      return <SectionLoading />
    }

    return (
      <Tabs
        id="EntityTableViewsTabs"
        className="EntityTableViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeSchema.name}
        renderActiveTabPanelOnly
        vertical
      >
        {schemaViews.map(ref => (
          <Tab
            id={ref.id}
            key={ref.id}
            className="EntityTableViews__tab"
            title={
              <>
                {isPending && <Skeleton.Text type="span" length={15} />}
                {!isPending && <Schema.Label schema={ref.id} plural icon />}
                <Count count={ref.count} isPending={isPending} />
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
            className="EntityTableViews__tab schema-add-tab"
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
  
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(EntityTableViews);
