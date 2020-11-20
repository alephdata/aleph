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

class InvestigationDocumentsMode extends React.Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
  }

  onSearch(queryText) {
    console.log('in on search', queryText)
    const { history, query, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.mode = 'search';
    parsedHash.type = 'Document';

    const newQuery = query.set('q', queryText);
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { query, collection } = this.props;

    return (
      <DocumentManager query={query} collection={collection} onSearch={this.onSearch}/>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;

  return {
    query: queryCollectionDocuments(location, collection.id, true),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationDocumentsMode);
