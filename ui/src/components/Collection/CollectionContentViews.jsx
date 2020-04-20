import _ from 'lodash';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Classes, MenuDivider, Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import { Count, Schema, SchemaSelect } from 'src/components/common';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'src/components/Collection/CollectionEntitiesMode';
import { selectModel } from 'src/selectors';

import './CollectionContentViews.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});

/* eslint-disable */
class CollectionContentViews extends React.Component {
  constructor(props) {
    super(props);
    const { activeType, collection } = props;

    let addedSchemata = [];
    if (activeType) {
      if (!collection?.schemata?.hasOwnProperty(activeType)) {
        addedSchemata = [activeType];
      }
    }

    this.state = {
      addedSchemata,
    }

    this.handleTabChange = this.handleTabChange.bind(this);
    this.onSchemaAdd = this.onSchemaAdd.bind(this);
  }

  onSchemaAdd(schema) {
    const schemaName = schema.name;
    this.setState(({ addedSchemata }) => ({ addedSchemata: [...addedSchemata, schemaName] }));
    this.handleTabChange(schema);
  }

  getEntitySchemata() {
    const { collection, model } = this.props;
    const { addedSchemata } = this.state;

    const matching = [];
    for (const key in collection.schemata) {
      if (!model.getSchema(key).isDocument()) {
        matching.push({
          schema: key,
          count: collection.schemata[key],
        });
      }
    }
    const existingSchemata = _.reverse(_.sortBy(matching, ['count']));
    const newSchemata = addedSchemata.map(schema => ({ schema, count: 0 }));

    return [...existingSchemata, ...newSchemata];
  }

  countDocuments() {
    const { collection, model } = this.props;
    let totalCount = 0;
    for (const key in collection.schemata) {
      if (model.getSchema(key).isDocument()) {
        totalCount += collection.schemata[key];
      }
    }
    return totalCount;
  }

  handleTabChange(type) {
    const { history, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = type;
    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeType, editMode, intl, xref, onChange,
    } = this.props;
    const numOfDocs = this.countDocuments();
    const entitySchemata = this.getEntitySchemata();
    const hasBrowse = (numOfDocs > 0 || collection.writeable);

    const selectedTab = activeType || (hasBrowse ? 'Document' : entitySchemata[0]?.schema);
    const isPending = collection.isPending && !collection.id;
    const showSchemaSelect = !isPending && collection.writeable;

    return (
      <Tabs
        id="CollectionContentTabs"
        className="CollectionContentViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={selectedTab}
        renderActiveTabPanelOnly
        animate={false}
        vertical
      >
        {(isPending || hasBrowse) && (
          <Tab
            id="Document"
            className={'CollectionContentViews__tab'}
            title={
              <span className={c({ [Classes.SKELETON]: isPending })}>
                <Icon icon="folder" className="left-icon" />
                <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                <Count count={numOfDocs} />
              </span>}
            panel={<CollectionDocumentsMode collection={collection} editMode={editMode} />}
          />
        )}
        {hasBrowse && entitySchemata.length > 0 && <MenuDivider />}
        {entitySchemata.map(ref => (
          <Tab
            id={ref.schema}
            key={ref.schema}
            className="CollectionContentViews__tab"
            title={
              <>
                <Schema.Label schema={ref.schema} plural icon />
                <Count count={ref.count} />
              </>}
            panel={<CollectionEntitiesMode collection={collection} schema={selectedTab} editMode={editMode} />}
          />
        ))}
        {showSchemaSelect && <MenuDivider />}
        {showSchemaSelect && (
          <Tab
            id="new"
            key="new"
            disabled
            className="CollectionContentViews__tab schema-add-tab"
            title={
              <SchemaSelect
                placeholder={intl.formatMessage(messages.addSchemaPlaceholder)}
                onSelect={this.onSchemaAdd}
                optionsFilter={schema => !entitySchemata.find(item => (item.schema === schema.name))}
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
    editMode: hashQuery.editMode,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, {}),
  injectIntl,
)(CollectionContentViews);
