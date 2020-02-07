import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { MenuDivider, Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, Schema } from 'src/components/common';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'src/components/Collection/CollectionEntitiesMode';
import { selectCollectionXrefIndex, selectModel } from 'src/selectors';

import './CollectionContentViews.scss';

/* eslint-disable */
class CollectionViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  getEntitySchemata() {
    const { collection, model } = this.props;
    const matching = [];
    for (const key in collection.schemata) {
      if (!model.getSchema(key).isDocument()) {
        matching.push({
          schema: key,
          count: collection.schemata[key],
        });
      }
    }
    return _.reverse(_.sortBy(matching, ['count']));
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
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeType, xrefIndex, onChange,
    } = this.props;
    const numOfDocs = this.countDocuments();
    const entitySchemata = this.getEntitySchemata();
    const hasBrowse = (numOfDocs > 0 || collection.writeable);
    return (
      <Tabs
        id="CollectionContentTabs"
        className="CollectionContentViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeType}
        renderActiveTabPanelOnly
        animate={false}
        vertical
      >
        {hasBrowse && (
          <Tab
            id="Document"
            className="CollectionContentViews__tab"
            title={
              <>
                <Icon icon="folder" className="left-icon" />
                <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                <Count count={numOfDocs} />
              </>}
            panel={<CollectionDocumentsMode collection={collection} />}
          />
        )}
        <MenuDivider />
        {entitySchemata.map(ref => (
          <Tab
            id={ref.schema}
            key={ref.schema}
            className="CollectionContentViews__tab"
            title={
              <>
                <Schema.Smart.Label schema={ref.schema} plural icon />
                <Count count={ref.count} />
              </>}
            panel={<CollectionEntitiesMode collection={collection} activeType={activeType} />}
          />
        ))}
      </Tabs>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);

  return {
    model: selectModel(state),
    xrefIndex: selectCollectionXrefIndex(state, collection.id),
    activeType: hashQuery.type || 'Document',
  };
};

CollectionViews = connect(mapStateToProps, {})(CollectionViews);
CollectionViews = injectIntl(CollectionViews);
CollectionViews = withRouter(CollectionViews);
export default CollectionViews;
