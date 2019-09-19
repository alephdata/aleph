import React, { Component } from 'react';
import {
  defineMessages, injectIntl, FormattedNumber, FormattedMessage,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';
import Query from 'src/app/Query';
import Dashboard from 'src/components/Dashboard/Dashboard';
import { queryCollections } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import {
  Breadcrumbs, SectionLoading, ErrorSection,
} from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import CollectionListItem from 'src/components/Collection/CollectionListItem';


import './GroupSourcesScreen.scss';

const messages = defineMessages({
  title: {
    id: 'sources.index.title',
    defaultMessage: 'Sources',
  },
  placeholder: {
    id: 'sources.index.filter',
    defaultMessage: 'Filter the sources…',
  },
  facet_category: {
    id: 'search.facets.facet.category',
    defaultMessage: 'Categories',
  },
  facet_countries: {
    id: 'search.facets.facet.countries',
    defaultMessage: 'Countries',
  },
});


export class GroupSourcesScreen extends Component {
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
    const { result, intl } = this.props;

    const breadcrumbs = (
      <Breadcrumbs>
        { !!result.total && (
          <Breadcrumbs.Text text={(
            <FormattedMessage
              id="sources.index.total"
              defaultMessage="{total} sources of documents and data"
              values={{
                total: <FormattedNumber value={result.total || 0} />,
              }}
            />
            )}
          />
        )}
        { !result.total && (
          <Breadcrumbs.Text text={(
            <FormattedMessage
              id="sources.index.none"
              defaultMessage="No sources were found"
            />
            )}
          />
        )}
      </Breadcrumbs>
    );


    return (
      <Screen
        className="GroupSourcesScreen"
        title={intl.formatMessage(messages.title)}
      >
        <Dashboard>
          <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
          {result.isError && (
            <ErrorSection error={result.error} />
          )}
          {breadcrumbs}
          <ul className="results">
            {result.results !== undefined && result.results.map(
              res => <CollectionListItem key={res.id} collection={res} />,
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
        </Dashboard>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { groupId } = ownProps.match.params;
  console.log(ownProps);
  // ?collectionsfilter:team_id=5
  console.log(groupId, `collectionsfilter:team_id=${groupId}`);
  const context = {
    'filter:kind': 'source',
  };
  const query = Query.fromLocation('collections', { search: `collectionsfilter:team_id=${groupId}` }, context, 'collections')
    .sortBy('count', 'desc')
    .limit(40);
  return {
    query,
    result: selectCollectionsResult(state, query),
  };
};
const mapDispatchToProps = { queryCollections };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(GroupSourcesScreen);
