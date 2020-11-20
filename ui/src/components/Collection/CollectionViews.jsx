import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, ResultCount } from 'components/common';
import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import { collectionModes } from 'components/Collection/collectionModes';
import { queryCollectionXrefFacets } from 'queries';
import { selectModel, selectCollectionXrefResult } from 'selectors';

import './CollectionViews.scss';

class CollectionViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  componentDidUpdate() {
    const { activeMode } = this.props;
    if (!!activeMode && !collectionModes[activeMode]) {
      this.handleTabChange();
    }
  }

  handleTabChange(mode) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    if (mode) {
      parsedHash.mode = mode;
    } else {
      delete parsedHash.mode;
    }
    delete parsedHash.type;

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeMode = "overview", diagrams, lists, xref,
      showDocumentsTab,
      documentTabCount, entitiesTabCount
    } = this.props;

    return (
      <Tabs
        id="CollectionInfoTabs"
        className="CollectionViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeMode}
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
        {showDocumentsTab && (
          <Tab
            id={'documents'}
            className="CollectionViews__tab"
            title={
              <>
                <Icon icon="document" className="left-icon" />
                <FormattedMessage id="entity.info.documents" defaultMessage="Documents" />
                <Count count={documentTabCount} />
              </>}
            panel={<CollectionDocumentsMode collection={collection} />}
          />
        )}
        <Tab
          id={'xref'}
          className="CollectionViews__tab"
          title={
            <>
              <Icon className="left-icon" icon="comparison" />
              <FormattedMessage id="entity.info.xref" defaultMessage="Cross-reference" />
              <ResultCount result={xref} />
            </>}
          panel={<CollectionXrefMode collection={collection} />}
        />
      </Tabs>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const model = selectModel(state);
  const xrefQuery = queryCollectionXrefFacets(location, collection.id);
  const schemata = collection?.statistics?.schema?.values;
  let documentTabCount, entitiesTabCount;

  if (schemata) {
    documentTabCount = 0;

    for (const key in schemata) {
      const schema = model.getSchema(key);
      if (schema.isDocument()) {
        documentTabCount += schemata[key];
      }
    }
  }

  return {
    documentTabCount: documentTabCount,
    showDocumentsTab: (documentTabCount > 0 || collection.writeable),
    xref: selectCollectionXrefResult(state, xrefQuery),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionViews);
