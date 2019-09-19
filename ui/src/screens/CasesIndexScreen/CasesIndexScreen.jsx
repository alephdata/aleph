import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import Query from 'src/app/Query';
import { queryCollections } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import {
  Breadcrumbs, ErrorSection, SectionLoading,
} from 'src/components/common';
import CollectionListItem from 'src/components/Collection/CollectionListItem';
import CollectionIndexSearch from 'src/components/Collection/CollectionIndexSearch';

import './CasesIndexScreen.scss';

const messages = defineMessages({
  no_results_title: {
    id: 'cases.no_results_title',
    defaultMessage: 'You do not have any case files yet',
  },
  filter: {
    id: 'case.search_cases_placeholder',
    defaultMessage: 'Search cases',
  },
  not_found: {
    id: 'case.not.found',
    defaultMessage: 'Log in to create your own case files, upload documents and manage your investigations!',
  },
  facet_countries: {
    id: 'search.facets.facet.countries',
    defaultMessage: 'Countries',
  },
  facet_team: {
    id: 'search.facets.facet.team',
    defaultMessage: 'Shared with',
  },
});


export class CasesIndexScreen extends Component {
  constructor(props) {
    super(props);

    this.updateQuery = this.updateQuery.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && result.next && !result.isLoading && !result.isError) {
      this.props.queryCollections({ query, next: result.next });
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  render() {
    const { query, result, intl } = this.props;
    const breadcrumbs = (
      <Breadcrumbs>
        <li>
          <FormattedMessage
            id="cases.browser.breadcrumb"
            defaultMessage="Cases overview"
          />
        </li>
      </Breadcrumbs>
    );
    return (
      <Screen className="CasesIndexScreen" breadcrumbs={breadcrumbs} requireSession>
        <Dashboard>
          <h5 className="Dashboard__title"><FormattedMessage id="case.question" defaultMessage="Manage your investigations" /></h5>
          <p className="description-explanation">
            <FormattedMessage
              id="case.description"
              defaultMessage="Case files help you group and share the documents and data which belong to a particular story. You can upload documents, such as PDFs, email archives or spreadsheets, and they will be made easy to search and browse."
            />
          </p>

          <CollectionIndexSearch query={query} updateQuery={this.updateQuery} casefiles />
          <ul className="results">
            {result.results !== undefined && result.results
              .map(res => <CollectionListItem key={res.id} collection={res} preview={false} />)}
          </ul>
          {result.total === 0 && (
            <ErrorSection
              visual="search"
              title={intl.formatMessage(messages.no_results_title)}
            />
          )}
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
  const { location } = ownProps;
  const context = {
    facet: ['countries', 'team.name'],
    'filter:kind': 'casefile',
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('updated_at', 'desc')
    .limit(30);

  return {
    query,
    result: selectCollectionsResult(state, query),
  };
};

const mapDispatchToProps = {
  queryCollections,
};
export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(CasesIndexScreen);
