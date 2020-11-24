import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup, ControlGroup, Intent } from '@blueprintjs/core';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import { queryCollectionDocuments, queryCollectionEntities } from 'queries';
import Query from 'app/Query';
import queryString from 'query-string';
import { selectEntitiesResult } from 'selectors';
import { SearchBox } from 'components/common';

import './CollectionSearchMode.scss';

const facetKeys = [
  'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes',
];

const messages = defineMessages({
  placeholder: {
    id: 'collection.search.placeholder',
    defaultMessage: 'Search {collection}',
  },
});

class CollectionSearchMode extends React.Component {
  constructor(props) {
    super(props);

    this.updateQuery = this.updateQuery.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.toggleType = this.toggleType.bind(this);
  }

  updateQuery({ search, hash}) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: search,
      hash: hash || location.hash,
    });
  }

  onSearch(queryText) {
    const { query } = this.props;
    const newQuery = query.set('q', queryText);
    this.updateQuery({ search: newQuery.toLocation() });
  }

  toggleType(type) {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    if (parsedHash.type === type) {
      delete parsedHash.type;
    } else {
      parsedHash.type = type;
    }
    this.updateQuery({ hash: queryString.stringify(parsedHash) });
  }

  render() {
    const { activeType, collection, intl, query, result } = this.props;

    // <ButtonGroup className="CollectionSearchMode__type-toggle">
    //   <Button outlined onClick={() => this.toggleType('Thing')} icon="thing" {...(activeType === 'Thing' ? activeProps : {})}>
    //     <FormattedMessage id="collection.search.entities" defaultMessage="Entities" />
    //   </Button>
    //   <Button outlined onClick={() => this.toggleType('Document')} icon="document" {...(activeType === 'Document' ? activeProps : {})}>
    //     <FormattedMessage id="collection.search.documents" defaultMessage="Documents" />
    //   </Button>
    // </ButtonGroup>

    const activeProps = { active: true, intent: Intent.PRIMARY, outlined: false };
    return (
      <div className="CollectionSearchMode">
        <FacetedEntitySearch
          facets={facetKeys}
          query={query}
          result={result}
        >
          <div className="CollectionSearchMode__search-container">
            <div className="CollectionSearchMode__search">
              <SearchBox
                onSearch={this.onSearch}
                query={query}
                inputProps={{ large: true, fill: true }}
                placeholder={intl.formatMessage(messages.placeholder, { collection: collection.label })}
              />
            </div>
          </div>
        </FacetedEntitySearch>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const activeType = hashQuery.type;
  let query;

  if (activeType === 'Document') {
    query = queryCollectionDocuments(location, collection.id);
  } else {
    query = queryCollectionEntities(location, collection.id);
  }
  const result = selectEntitiesResult(state, query);
  return { activeType, query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionSearchMode);
