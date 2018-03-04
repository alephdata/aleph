import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { NonIdealState } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';
import EntityList from 'src/components/EntityScreen/EntityList';
import SectionLoading from 'src/components/common/SectionLoading';
import SearchFacets from 'src/components/Facet/SearchFacets';

import './SearchScreen.css';


const messages = defineMessages({
  facet_schema: {
    id: 'search.facets.facet.schema',
    defaultMessage: 'Types',
  },
  facet_collection_id: {
    id: 'search.facets.facet.collection_id',
    defaultMessage: 'Collections',
  },
  facet_languages: {
    id: 'search.facets.facet.languages',
    defaultMessage: 'Languages',
  },
  facet_emails: {
    id: 'search.facets.facet.emails',
    defaultMessage: 'E-Mails',
  },
  facet_phones: {
    id: 'search.facets.facet.phones',
    defaultMessage: 'Phones',
  },
  facet_countries: {
    id: 'search.facets.facet.countries',
    defaultMessage: 'Countries',
  },
  facet_names: {
    id: 'search.facets.facet.names',
    defaultMessage: 'Names',
  },
  facet_addresses: {
    id: 'search.facets.facet.addresses',
    defaultMessage: 'Addresses',
  },
  facet_mime_type: {
    id: 'search.facets.facet.mime_type',
    defaultMessage: 'File types',
  },
  facet_author: {
    id: 'search.facets.facet.author',
    defaultMessage: 'Authors',
  },
  no_results_title: {
    id: 'search.no_results_title',
    defaultMessage: 'No search results',
  },
  no_results_description: {
    id: 'search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
});


class SearchScreen extends React.Component {
  constructor(props) {
    const { intl } = props;
    super(props)

    const facets = [
      {
        field: 'collection_id',
        label: intl.formatMessage(messages.facet_collection_id),
        icon: 'database'
      },
      {
        field: 'schema',
        label: intl.formatMessage(messages.facet_schema),
        icon: 'list',
        initiallyOpen: true
      },
      {
        field: 'countries',
        label: intl.formatMessage(messages.facet_countries),
        icon: 'globe'
      },
      {
        field: 'languages',
        label: intl.formatMessage(messages.facet_languages),
        icon: 'translate'
      },
      {
        field: 'emails',
        label: intl.formatMessage(messages.facet_emails),
        icon: 'envelope'
      },
      {
        field: 'phones',
        label: intl.formatMessage(messages.facet_phones),
        icon: 'phone'
      },
      {
        field: 'names',
        label: intl.formatMessage(messages.facet_names),
        icon: 'id-number'
      },
      {
        field: 'addresses',
        label: intl.formatMessage(messages.facet_addresses),
        icon: 'map'
      },
      {
        field: 'mime_type',
        label: intl.formatMessage(messages.facet_mime_type),
        icon: 'document'
      },
      {
        field: 'author',
        label: intl.formatMessage(messages.facet_author),
        icon: 'person'
      }
    ];
    this.state = {facets: facets};

    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    // Check for a change of query, as unconditionally calling fetchIfNeeded
    // could cause an infinite loop (if fetching fails).
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const { result, query, queryEntities } = this.props;
    if (result.isLoading || (result.status === 'error')) {
      queryEntities({ query: query });
    }
  }

  getMoreResults() {
    const { query, result, queryEntities } = this.props;
    if (!result.isLoading && result.next) {
      queryEntities({ query, next: result.next });
    }
  }

  updateQuery(newQuery, { replace = false } = {}) {
    const { history, location } = this.props;
    const navigate = replace ? history.replace : history.push;
    navigate({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  render() {
    const { query, result, intl } = this.props;
    const aspects = {
      filter: true,
      collections: true,
      countries: true
    };

    return (
      <Screen query={query}
              updateQuery={this.updateQuery}
              title={query.getString('q')}>
        <DualPane className="SearchScreen">
          <DualPane.InfoPane className="SearchFacetsPane">
            <SearchFacets query={query}
                          updateQuery={this.updateQuery}
                          facets={this.state.facets} />
          </DualPane.InfoPane>
          <DualPane.ContentPane>
            {/*<SearchFilter {...searchContext} />*/}
            { result.total === 0 &&
              <NonIdealState visual="search"
                             title={intl.formatMessage(messages.no_results_title)}
                             description={intl.formatMessage(messages.no_results_description)} />
            }
            <EntityList query={query}
                        aspects={aspects}
                        updateQuery={this.updateQuery}
                        result={result} />
            { !result.isLoading && result.next && (
              <Waypoint
                onEnter={this.getMoreResults}
                bottomOffset="-600px"
                scrollableAncestor={window}
              />
            )}
            { result.isLoading && (
              <SectionLoading />
            )}
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;

  // We normally only want Things, not Intervals (relations between things).
  const context = {
    'filter:schemata': 'Thing',
    'limit': 50
  };
  const query = Query.fromLocation('search', location, context, '');
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

SearchScreen = connect(mapStateToProps, { queryEntities })(SearchScreen);
SearchScreen = withRouter(SearchScreen);
export default injectIntl(SearchScreen);
