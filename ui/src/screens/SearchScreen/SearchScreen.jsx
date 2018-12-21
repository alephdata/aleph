import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import queryString from 'query-string';
import {defineMessages, injectIntl, FormattedNumber, FormattedMessage} from 'react-intl';
import Waypoint from 'react-waypoint';
import { Icon} from '@blueprintjs/core';

import Query from 'src/app/Query';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import { DualPane, SectionLoading, SignInCallout, ErrorSection, Breadcrumbs } from 'src/components/common';
import EntityTable from 'src/components/EntityTable/EntityTable';
import SearchFacets from 'src/components/Facet/SearchFacets';
import QueryTags from 'src/components/QueryTags/QueryTags';
import SuggestAlert from "src/components/SuggestAlert/SuggestAlert";
import Screen from 'src/components/Screen/Screen';
import togglePreview from 'src/util/togglePreview';

import './SearchScreen.scss';

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
  },
  page_title: {
    id: 'search.title',
    defaultMessage: 'Search',
  }
});

class SearchScreen extends React.Component {
  constructor(props) {
    super(props);
    const { intl } = props;

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

    this.state = {
      facets: facets,
      hideFacets: false
    };

    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.toggleFacets = this.toggleFacets.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntities({query: query});
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
    // make it so the preview disappears if the query is changed.
    const parsedHash = queryString.parse(location.hash);
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:type'] = undefined;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  getCurrentPreviewIndex() {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    return this.props.result.results.findIndex(
      entity => entity.id === parsedHash['preview:id']
    )
  }

  showNextPreview() {
    const currentSelectionIndex = this.getCurrentPreviewIndex();
    const nextEntity = this.props.result.results[1 + currentSelectionIndex];
    if(nextEntity){
      this.showPreview(nextEntity)
    }
  }

  showPreviousPreview() {
    const currentSelectionIndex = this.getCurrentPreviewIndex();
    const nextEntity = this.props.result.results[currentSelectionIndex - 1];
    if(nextEntity){
      this.showPreview(nextEntity)
    }
  }

  showPreview(entity) {
    const { history } = this.props;
    const isDocument = entity.schemata.indexOf('Document') !== -1;
    const previewType = isDocument ? 'document' : 'entity';
    togglePreview(history, entity, previewType);
  }

  toggleFacets() {
    this.setState({hideFacets: !this.state.hideFacets});
  }

  render() {
    const {query, result, intl} = this.props;
    const {hideFacets} = this.state;
    const title = query.getString('q') || intl.formatMessage(messages.page_title);
    const hideFacetsClass = hideFacets ? 'show' : 'hide';
    const plusMinusIcon = hideFacets ? 'minus' : 'plus';

    const breadcrumbs = (<Breadcrumbs hasSearchBar={false}>
      <li>
        <span className="bp3-breadcrumb bp3-breadcrumb-current">
          {!(result.isLoading || result.total === undefined) && (
            <React.Fragment>
              <FormattedNumber value={result.total}/>&nbsp;
              <FormattedMessage id="search.screen.results" defaultMessage="results"/>
            </React.Fragment>
          )}
          { result.isLoading && (
            <FormattedMessage id="search.screen.searching" defaultMessage="Searching..."/>
          )}
          { result.isError && (
            <FormattedMessage id="search.screen.error" defaultMessage="Error"/>
          )}
        </span>
      </li>
    </Breadcrumbs>);

    return (
      <Screen
        query={query}
        updateQuery={this.updateQuery}
        title={title}
        hotKeys={[
          {combo:'j', global:true, label:"Preview next search entity", onKeyDown:this.showNextPreview },
          {combo:'k', global:true, label:"Preview previous search entity" ,onKeyDown:this.showPreviousPreview }
        ]}
      >

        {breadcrumbs}
        <DualPane className="SearchScreen">
          <DualPane.SidePane className='side-pane-padding'>
            <div onClick={this.toggleFacets} className='visible-sm-flex facets total-count bp3-text-muted'>
              <Icon icon={plusMinusIcon} />
              <span className='total-count-span'>
                <FormattedMessage id="search.screen.filters" defaultMessage="Filters"/>
              </span>
            </div>
            <div className={hideFacetsClass}>
              <SearchFacets query={query}
                            result={result}
                            updateQuery={this.updateQuery}
                            facets={this.state.facets}/>
            </div>
          </DualPane.SidePane>
          <DualPane.ContentPane className="padded">
            <SignInCallout/>
            <QueryTags query={query} updateQuery={this.updateQuery}/>
            <EntityTable query={query}
                         updateQuery={this.updateQuery}
                         result={result} />
            {result.total === 0 && (
              <ErrorSection visual="search"
                            title={intl.formatMessage(messages.no_results_title)}
                            resolver={<SuggestAlert queryText={query.state.q}/>}
                            description={intl.formatMessage(messages.no_results_description)}/>
            )}
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
    'highlight': true,
    'highlight_count': 3,
    'highlight_length': 140,
    'filter:schemata': 'Thing',
    'limit': 50
  };
  const query = Query.fromLocation('entities', location, context, '');
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

SearchScreen = connect(mapStateToProps, { queryEntities })(SearchScreen);
SearchScreen = withRouter(SearchScreen);
export default injectIntl(SearchScreen);
