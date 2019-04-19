import React, { Component } from 'react';
import {
  defineMessages, FormattedMessage, FormattedNumber, injectIntl,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';
import Query from 'src/app/Query';
import { queryCollections } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import {
  Breadcrumbs, DualPane, SectionLoading, SignInCallout, ErrorSection,
} from 'src/components/common';
import SearchFacets from 'src/components/Facet/SearchFacets';
import QueryTags from 'src/components/QueryTags/QueryTags';
import Screen from 'src/components/Screen/Screen';
import CollectionListItem from 'src/components/Collection/CollectionListItem';
import CollectionIndexSearch from 'src/components/Collection/CollectionIndexSearch';


import './SourcesIndexScreen.scss';

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


export class SourcesIndexScreen extends Component {
  constructor(props) {
    super(props);
    const { intl } = props;
    this.state = {
      facets: [
        {
          field: 'category',
          label: intl.formatMessage(messages.facet_category),
          icon: 'list',
          defaultSize: 20,
        },
        {
          field: 'countries',
          label: intl.formatMessage(messages.facet_countries),
          icon: 'globe',
          defaultSize: 300,
        },
      ],
    };

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
    const { result, query, intl } = this.props;
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
        className="SourcesIndexScreen"
        title={intl.formatMessage(messages.title)}
      >
        {breadcrumbs}
        <DualPane>
          <DualPane.SidePane>
            <SearchFacets
              facets={this.state.facets}
              query={query}
              result={result}
              updateQuery={this.updateQuery}
            />
          </DualPane.SidePane>
          <DualPane.ContentPane className="padded">
            <CollectionIndexSearch query={query} updateQuery={this.updateQuery} />
            <SignInCallout />
            <QueryTags query={query} updateQuery={this.updateQuery} />
            {result.isError && (
              <ErrorSection error={result.error} />
            )}
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
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const context = {
    facet: ['category', 'countries'],
    'filter:kind': 'source',
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
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
)(SourcesIndexScreen);
