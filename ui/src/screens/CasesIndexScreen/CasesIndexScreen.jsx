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
import CaseCreateButton from 'src/components/Toolbar/CaseCreateButton';

import './CasesIndexScreen.scss';


const messages = defineMessages({
  title: {
    id: 'cases.title',
    defaultMessage: 'Personal datasets',
  },
  no_results_title: {
    id: 'cases.no_results_title',
    defaultMessage: 'You do not have any personal datasets yet',
  },
  placeholder: {
    id: 'cases.placeholder',
    defaultMessage: 'Search personal datasets...',
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
      <Screen
        className="CasesIndexScreen"
        breadcrumbs={breadcrumbs}
        title={intl.formatMessage(messages.title)}
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <div className="Dashboard__actions">
              <CaseCreateButton />
            </div>
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="case.description"
                defaultMessage="Personal datasets let you upload and share documents and data which belong to a particular story. You can upload PDFs, email archives or spreadsheets, and they will be made easy to search and browse."
              />
            </p>
          </div>
          {!result.isLoading && result.total === 0 && (
            <ErrorSection
              icon="search"
              title={intl.formatMessage(messages.no_results_title)}
            />
          )}
          {!result.isLoading && result.total !== 0 && (
            <>
              <CollectionIndexSearch
                query={query}
                updateQuery={this.updateQuery}
                placeholder={intl.formatMessage(messages.placeholder)}
              />
              <ul className="results">
                {result.results !== undefined && result.results
                  .map(res => <CollectionListItem key={res.id} collection={res} preview={false} />)}
              </ul>

              <Waypoint
                onEnter={this.getMoreResults}
                bottomOffset="-300px"
                scrollableAncestor={window}
              />
            </>
          )}
          {result.isLoading && (
            <SectionLoading />
          )}
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  console.log(state);
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

export default compose(
  connect(mapStateToProps, { queryCollections }),
  injectIntl,
)(CasesIndexScreen);
