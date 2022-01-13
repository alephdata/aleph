import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, Intent } from '@blueprintjs/core';

import withRouter from 'app/withRouter'
import { queryCollections } from 'actions';
import { selectCollectionsResult, selectCurrentRole } from 'selectors';
import { ErrorSection, SearchBox, QueryInfiniteLoad } from 'components/common';
import QueryTags from 'components/QueryTags/QueryTags';
import SearchActionBar from 'components/common/SearchActionBar';
import CollectionIndexItem from './CollectionIndexItem';
import SortingBar from 'components/SortingBar/SortingBar';


import './CollectionIndex.scss';

const messages = defineMessages({
  show_mine: {
    id: 'collection.index.filter.mine',
    defaultMessage: 'Created by me',
  },
  show_all: {
    id: 'collection.index.filter.all',
    defaultMessage: 'All',
  },
});

export class CollectionIndex extends Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.toggleCreatedBy = this.toggleCreatedBy.bind(this);
  }

  onSearch(queryText) {
    const { query } = this.props;
    const newQuery = query.set('q', queryText);
    this.updateQuery(newQuery);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  toggleCreatedBy() {
    const { createdByFilterVal, query, role } = this.props;
    const newQuery = createdByFilterVal.length ? query.clearFilter('creator_id') : query.setFilter('creator_id', role.id);
    this.updateQuery(newQuery);
  }

  renderErrors() {
    const { emptyText, icon, noResultsText, query, result } = this.props;
    const hasQuery = query.hasQuery() || query.hasFilter('creator_id');

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }
    if (result.total === 0) {
      const message = hasQuery ? noResultsText : emptyText;

      return <ErrorSection icon={icon} title={message} />;
    }

    return null;
  }

  renderResults() {
    const { result } = this.props;
    const skeletonItems = [...Array(10).keys()];

    return (
      <ul className="index">
        {result.results.map(
          res => <CollectionIndexItem key={res.id} collection={res} />,
        )}
        {result.isPending && skeletonItems.map(
          item => <CollectionIndexItem key={item} isPending />,
        )}
      </ul>
    );
  }

  render() {
    const { createdByFilterVal, intl, placeholder, query, result, showQueryTags } = this.props;

    return (
      <div className="CollectionIndex">
        <div className="CollectionIndex__controls">
          <SearchBox
            onSearch={this.onSearch}
            placeholder={placeholder}
            query={query}
            inputProps={{ large: true, autoFocus: true }}
          />
          {showQueryTags && (
            <QueryTags query={query} updateQuery={this.updateQuery} />
          )}
          <SearchActionBar result={result}>
            <SortingBar
              query={query}
              updateQuery={this.updateQuery}
              sortingFields={['created_at', 'count', 'label', 'updated_at']}
              filterButton={
                <Button
                  text={intl.formatMessage(createdByFilterVal.length ? messages.show_mine : messages.show_all)}
                  onClick={this.toggleCreatedBy}
                  minimal
                  intent={Intent.PRIMARY}
                />
              }
            />
          </SearchActionBar>
        </div>
        {this.renderErrors()}
        {this.renderResults()}
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.queryCollections}
        />
      </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const createdByFilterVal = query.getFilter('creator_id');

  return {
    result: selectCollectionsResult(state, query),
    role: selectCurrentRole(state),
    createdByFilterVal
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollections }),
  injectIntl
)(CollectionIndex);
