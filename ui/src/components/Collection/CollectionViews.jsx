import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import {
  Count, TextLoading, Schema,
} from 'src/components/common';
import CollectionOverviewMode from 'src/components/Collection/CollectionOverviewMode';
import CollectionXrefIndexMode from 'src/components/Collection/CollectionXrefIndexMode';
import CollectionDiagramsIndexMode from 'src/components/Collection/CollectionDiagramsIndexMode';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'src/components/Collection/CollectionEntitiesMode';
import CollectionContentViews from 'src/components/Collection/CollectionContentViews';

import { selectCollectionXrefIndex, selectModel } from 'src/selectors';

import './CollectionViews.scss';

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
      delete parsedHash.type;
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

    let selectedTab = activeMode;

    // if (activeMode !== 'overview' && activeMode !== 'diagrams' && activeMode !== 'xref') {
    //   selectedTab = 'browse';
    // }
    return (
      <Tabs
        id="CollectionInfoTabs"
        className="CollectionViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={selectedTab}
        renderActiveTabPanelOnly
      >
        <Tab
          id="overview"
          className="CollectionViews__tab"
          title={
            <>
              <Icon icon="grouped-bar-chart" className="left-icon" />
              <FormattedMessage id="entity.info.overview" defaultMessage="Overview" />
            </>}
          panel={<CollectionOverviewMode collection={collection} />}
        />
        <Tab
          id="browse"
          className="CollectionViews__tab"
          title={
            <>
              <Icon icon="inbox-search" className="left-icon" />
              <FormattedMessage id="entity.info.contents" defaultMessage="Browse" />
            </>}
          panel={<CollectionContentViews collection={collection} activeMode={activeMode} onChange={this.handleTabChange} />}
        />
        <Tab
          id="xref"
          className="CollectionViews__tab"
          title={
            <TextLoading loading={xrefIndex.shouldLoad || xrefIndex.isLoading}>
              <Icon className="left-icon" icon="comparison" />
              <FormattedMessage id="entity.info.xref" defaultMessage="Cross-reference" />
              <Count count={xrefIndex.total} />
            </TextLoading>}
          panel={<CollectionXrefIndexMode collection={collection} />}
        />
        {collection.casefile && (
          <Tab
            id="diagram"
            className="CollectionViews__tab"
            title={
              <>
                <Icon className="left-icon" icon="graph" />
                <FormattedMessage id="collection.info.diagrams" defaultMessage="Network diagrams" />
              </>
            }
            panel={<CollectionDiagramsIndexMode collection={collection} />}
          />
        )}
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
