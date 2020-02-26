import React, { Component } from 'react';
import {
  // defineMessages,
  // FormattedMessage,
  injectIntl,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Waypoint } from 'react-waypoint';
// import { ButtonGroup } from '@blueprintjs/core';

// import Query from 'src/app/Query';
import { queryCollections } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import {
  SectionLoading, ErrorSection,
} from 'src/components/common';
import QueryTags from 'src/components/QueryTags/QueryTags';
import CollectionIndexItem from './CollectionIndexItem';
import CollectionIndexSearch from './CollectionIndexSearch';

import './CollectionIndex.scss';

// const messages = defineMessages({
//   // placeholder: {
//   //   id: 'cases.placeholder',
//   //   defaultMessage: 'Search personal datasets...',
//   // },
// });

export class CollectionIndex extends Component {
  constructor(props) {
    super(props);

    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryCollections({ query, result, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  render() {
    const { noResultsText, placeholder, query, result, showQueryTags } = this.props;

    return (
      <div className="CollectionIndex">
        <CollectionIndexSearch
          query={query}
          updateQuery={this.updateQuery}
          placeholder={placeholder}
        />
        {showQueryTags && (
          <QueryTags query={query} updateQuery={this.updateQuery} />
        )}
        {result.isError && (
          <ErrorSection error={result.error} />
        )}
        {result.total === 0 && (
          <ErrorSection
            icon="shield"
            title={noResultsText}
          />
        )}
        <ul className="results">
          {result.results !== undefined && result.results.map(
            res => <CollectionIndexItem key={res.id} collection={res} />,
          )}
        </ul>
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
        {result.isLoading && (
          <SectionLoading />
        )}
      </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;

  return {
    result: selectCollectionsResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollections }),
  injectIntl,
)(CollectionIndex);
