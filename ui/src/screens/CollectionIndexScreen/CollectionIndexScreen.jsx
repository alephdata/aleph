import React, { Component } from 'react';
import {
  defineMessages, FormattedMessage, injectIntl,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';
import { ButtonGroup } from '@blueprintjs/core';

import Query from 'src/app/Query';
import { queryCollections } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import {
  Breadcrumbs, DualPane, SectionLoading, SignInCallout, ErrorSection, ResultCount,
} from 'src/components/common';
import SearchFacets from 'src/components/Facet/SearchFacets';
import QueryTags from 'src/components/QueryTags/QueryTags';
import Screen from 'src/components/Screen/Screen';
import CollectionListItem from 'src/components/Collection/CollectionListItem';
import CollectionIndexSearch from 'src/components/Collection/CollectionIndexSearch';
import CaseCreateButton from 'src/components/Toolbar/CaseCreateButton';

import './CollectionIndexScreen.scss';


const messages = defineMessages({
  title: {
    id: 'collection.index.title',
    defaultMessage: 'Datasets',
  },
  facet_category: {
    id: 'collection.index.facet.category',
    defaultMessage: 'Categories',
  },
  facet_countries: {
    id: 'collection.index.facet.countries',
    defaultMessage: 'Countries',
  },
});


export class CollectionIndexScreen extends Component {
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
    const operation = (
      <ButtonGroup>
        <CaseCreateButton />
      </ButtonGroup>
    );
    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Text icon="database">
          <FormattedMessage
            id="collection.index.breadcrumb"
            defaultMessage="Datasets"
          />
        </Breadcrumbs.Text>
        <Breadcrumbs.Text active>
          <ResultCount result={result} />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );

    return (
      <Screen
        className="CollectionIndexScreen"
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
            <SignInCallout />
            <CollectionIndexSearch query={query} updateQuery={this.updateQuery} />
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
)(CollectionIndexScreen);
