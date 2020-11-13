import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';

import DocumentManager from 'components/Document/DocumentManager';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import { queryCollectionDocuments } from 'queries';
import { selectEntitiesResult } from 'selectors';

const facetKeys = [
  'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes',
];

class InvestigationDocumentsMode extends React.Component {
  handleTabChange = (nextView) => {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.view = nextView;

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { activeView, browseQuery, collection, searchQuery, searchResult } = this.props;

    console.log('view is', activeView);

    return (
      <Tabs
        id="InvestigationDocumentsTabs"
        className="info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={activeView}
        renderActiveTabPanelOnly
      >
        <Tab
          id='browse'
          className="CollectionViews__tab"
          title={
            <>
              <Icon icon="folder-open" className="left-icon" />
              <FormattedMessage id="entity.info.overview" defaultMessage="Browse" />
            </>}
          panel={<DocumentManager query={browseQuery} collection={collection} />}
        />
        <Tab
          id='search'
          className="CollectionViews__tab"
          title={
            <>
              <Icon icon="search" className="left-icon" />
              <FormattedMessage id="entity.info.overview" defaultMessage="Search" />
            </>
          }
          panel={(
            <FacetedEntitySearch
              facets={facetKeys}
              query={searchQuery}
              result={searchResult}
            />
          )}
        />
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const hashQuery = queryString.parse(location.hash);

  const searchQuery = queryCollectionDocuments(location, collection.id, false);

  return {
    searchQuery,
    searchResult: selectEntitiesResult(state, searchQuery),
    browseQuery: queryCollectionDocuments(location, collection.id, true),
    activeView: hashQuery.view || 'browse'
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationDocumentsMode);
