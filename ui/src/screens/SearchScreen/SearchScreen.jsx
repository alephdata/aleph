import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {defineMessages, injectIntl, FormattedNumber, FormattedMessage} from 'react-intl';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import {queryEntities} from 'src/actions';
import {selectEntitiesResult} from 'src/selectors';
import { Screen, DualPane, SectionLoading, CalloutBox } from 'src/components/common';
import EntityTable from 'src/components/EntityTable/EntityTable';
import SearchFacets from 'src/components/Facet/SearchFacets';
import QueryTags from 'src/components/QueryTags/QueryTags';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';
import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';

import './SearchScreen.css';

const messages = defineMessages({
  facet_schema: {
    id: 'search.facets.facet.schema',
    defaultMessage: 'Types',
  },
  facet_collection_id: {
    id: 'search.facets.facet.collection_id',
    defaultMessage: 'Sources',
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
  }
});

class SearchScreen extends React.Component {
  constructor(props) {
    const {intl} = props;
    super(props);

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
        defaultSize: 20
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
    this.state = {facets: facets, isSignupOpen: false};

    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.onSignin = this.onSignin.bind(this);
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
    const {result, query, queryEntities} = this.props;
    if (result.isLoading || (result.status === 'error')) {
      queryEntities({query: query});
    }
  }

  getMoreResults() {
    const {query, result, queryEntities} = this.props;
    if (!result.isLoading && result.next) {
      queryEntities({query, next: result.next});
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  onSignin() {
    this.setState({isSignupOpen: !this.state.isSignupOpen})
  }

  render() {
    const {query, result, metadata, session} = this.props;
    const {isSignupOpen} = this.state;

    return (
      <Screen query={query}
              updateQuery={this.updateQuery}
              title={query.getString('q')}>
        <DualPane className="SearchScreen">
          <DualPane.InfoPane className="SearchFacetsPane">
            <div className='total-count pt-text-muted'>
              <span className='total-count-span'>
              <span className="total-icon pt-icon-standard pt-icon-search"/>
              <FormattedNumber value={result.total !== undefined ? result.total : 0}/>&nbsp;<FormattedMessage
                id="search.screen.results" defaultMessage="results"/>
            </span>
            </div>
            <SearchFacets query={query}
                          updateQuery={this.updateQuery}
                          facets={this.state.facets}/>
          </DualPane.InfoPane>
          <DualPane.ContentPane>
            {!session.loggedIn && <CalloutBox onClick={this.onSignin} className='callout'/>}
            <QueryTags query={query} updateQuery={this.updateQuery}/>
            {result.total === 0 &&
            <ErrorScreen.EmptyList visual="search" title={messages.no_results_title}
                                   description={messages.no_results_description}/>
            }
            <AuthenticationDialog auth={metadata.auth} isOpen={isSignupOpen} toggleDialog={this.toggleAuthentication}/>
            <EntityTable query={query}
                         updateQuery={this.updateQuery}
                         result={result}
                         showLinksInPreview={true}/>
            {!result.isLoading && result.next && (
              <Waypoint
                onEnter={this.getMoreResults}
                bottomOffset="-600px"
                scrollableAncestor={window}
              />
            )}
            {result.isLoading && (
              <SectionLoading/>
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
  return {query, result, metadata: state.metadata, session: state.session};
};

SearchScreen = connect(mapStateToProps, { queryEntities })(SearchScreen);
SearchScreen = withRouter(SearchScreen);
export default injectIntl(SearchScreen);
