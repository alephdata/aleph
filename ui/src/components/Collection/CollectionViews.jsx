import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab } from '@blueprintjs/core';
import queryString from 'query-string';

import {
  Count, TextLoading, Schema, Icon,
} from 'src/components/common';
import CollectionXrefIndexMode from 'src/components/Collection/CollectionXrefIndexMode';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'src/components/Collection/CollectionEntitiesMode';
import { selectCollectionXrefIndex, selectModel } from 'src/selectors';

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

  handleTabChange(mode) {
    const { history, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if (isPreview) {
      parsedHash['preview:mode'] = mode;
    } else {
      parsedHash.mode = mode;
    }
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeMode, xrefIndex,
    } = this.props;
    const numOfDocs = this.countDocuments();
    const entitySchemata = this.getEntitySchemata();
    const hasBrowse = (numOfDocs > 0 || collection.casefile);
    return (
      <Tabs
        id="EntityInfoTabs"
        onChange={this.handleTabChange}
        selectedTabId={activeMode}
        renderActiveTabPanelOnly
        className="info-tabs-padding"
      >
        {hasBrowse && (
          <Tab
            id="Document"
            disabled={numOfDocs === 0}
            title={
              <React.Fragment>
                <Icon name="folder" />
                <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                <Count count={numOfDocs} />
              </React.Fragment>}
            panel={<CollectionDocumentsMode collection={collection} />}
          />
        )}
        {entitySchemata.map(ref => (
          <Tab
            id={ref.schema}
            key={ref.schema}
            title={
              <React.Fragment>
                <Schema.Smart.Label schema={ref.schema} plural icon />
                <Count count={ref.count} />
              </React.Fragment>}
            panel={<CollectionEntitiesMode collection={collection} activeMode={activeMode} />}
          />
        ))}
        <Tab
          id="xref"
          disabled={xrefIndex.total < 1}
          title={
            <TextLoading loading={xrefIndex.shouldLoad || xrefIndex.isLoading}>
              <Icon name="relationship" />
              <FormattedMessage id="entity.info.xref" defaultMessage="Cross-reference" />
              <Count count={xrefIndex.total} />
            </TextLoading>}
          panel={<CollectionXrefIndexMode collection={collection} />}
        />
      </Tabs>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    model: selectModel(state),
    xrefIndex: selectCollectionXrefIndex(state, collection.id),
  };
};

CollectionViews = connect(mapStateToProps, {})(CollectionViews);
CollectionViews = injectIntl(CollectionViews);
CollectionViews = withRouter(CollectionViews);
export default CollectionViews;
