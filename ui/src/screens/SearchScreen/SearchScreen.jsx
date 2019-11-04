import React from 'react';
import queryString from 'query-string';
import {
  defineMessages, FormattedMessage, injectIntl,
} from 'react-intl';
import { Waypoint } from 'react-waypoint';
import { Icon, ButtonGroup, AnchorButton, Tooltip } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import {
  Collection, DualPane, SectionLoading, SignInCallout, ErrorSection, Breadcrumbs, ResultCount,
} from 'src/components/common';
import EntityTable from 'src/components/EntityTable/EntityTable';
import SearchFacets from 'src/components/Facet/SearchFacets';
import QueryTags from 'src/components/QueryTags/QueryTags';
import SuggestAlert from 'src/components/SuggestAlert/SuggestAlert';
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
    defaultMessage: 'Datasets',
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
    id: 'search.facets.facet.mimetypes',
    defaultMessage: 'File types',
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
  },
  alert_export_disabled: {
    id: 'search.screen.export_disabled',
    defaultMessage: 'Cannot export more than 10,000 results at a time',
  },
});


export class SearchScreen extends React.Component {
  constructor(props) {
    super(props);
    const { intl } = props;

    const facets = [
      {
        field: 'collection_id',
        label: intl.formatMessage(messages.facet_collection_id),
        icon: 'database',
      },
      {
        field: 'schema',
        label: intl.formatMessage(messages.facet_schema),
        icon: 'list-columns',
        defaultSize: 20,
      },
      {
        field: 'countries',
        label: intl.formatMessage(messages.facet_countries),
        icon: 'globe',
      },
      {
        field: 'languages',
        label: intl.formatMessage(messages.facet_languages),
        icon: 'translate',
      },
      {
        field: 'emails',
        label: intl.formatMessage(messages.facet_emails),
        icon: 'envelope',
      },
      {
        field: 'phones',
        label: intl.formatMessage(messages.facet_phones),
        icon: 'phone',
      },
      {
        field: 'names',
        label: intl.formatMessage(messages.facet_names),
        icon: 'id-number',
      },
      {
        field: 'addresses',
        label: intl.formatMessage(messages.facet_addresses),
        icon: 'map',
      },
      {
        field: 'mimetypes',
        label: intl.formatMessage(messages.facet_mime_type),
        icon: 'document',
      },
    ];

    this.state = {
      facets,
      hideFacets: false,
    };

    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.toggleFacets = this.toggleFacets.bind(this);
    this.fetchIfNeeded = this.fetchIfNeeded.bind(this);
    this.getCurrentPreviewIndex = this.getCurrentPreviewIndex.bind(this);
    this.showNextPreview = this.showNextPreview.bind(this);
    this.showPreviousPreview = this.showPreviousPreview.bind(this);
    this.showPreview = this.showPreview.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (!result.isLoading && result.next) {
      this.props.queryEntities({ query, next: result.next });
    }
  }

  getCurrentPreviewIndex() {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    return this.props.result.results.findIndex(
      entity => entity.id === parsedHash['preview:id'],
    );
  }

  getSearchScopes() {
    const { query } = this.props;
    const activeCollections = query ? query.getFilter('collection_id') : [];

    const collectionScopeList = activeCollections.map(collectionId => (
      {
        listItem: (
          <Collection.Load id={collectionId} renderWhenLoading="...">
            {collection => (
              <Collection.Label collection={collection} icon truncate={30} />
            )}
          </Collection.Load>
        ),
        onSearch: (queryText) => {
          const newQuery = query.set('q', queryText).setFilter('collection_id', collectionId);
          this.updateQuery(newQuery);
        },
      }
    ));

    if (activeCollections.length > 1) {
      collectionScopeList.push({
        listItem: <span>{`Search ${activeCollections.length} datasets`}</span>,
        onSearch: queryText => this.updateQuery(query.set('q', queryText)),
      });
    }

    return collectionScopeList;
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntities({ query });
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

  showNextPreview(event) {
    const currentSelectionIndex = this.getCurrentPreviewIndex();
    const nextEntity = this.props.result.results[1 + currentSelectionIndex];

    if (nextEntity && currentSelectionIndex >= 0) {
      event.preventDefault();
      this.showPreview(nextEntity);
    }
  }

  showPreviousPreview(event) {
    event.preventDefault();
    const currentSelectionIndex = this.getCurrentPreviewIndex();
    const nextEntity = this.props.result.results[currentSelectionIndex - 1];
    if (nextEntity && currentSelectionIndex >= 0) {
      event.preventDefault();
      this.showPreview(nextEntity);
    }
  }

  showPreview(entity) {
    togglePreview(this.props.history, entity);
  }

  toggleFacets() {
    this.setState(({ hideFacets }) => ({ hideFacets: !hideFacets }));
  }

  render() {
    const { query, result, intl } = this.props;
    const { hideFacets } = this.state;
    const title = query.getString('q') || intl.formatMessage(messages.page_title);
    const hideFacetsClass = hideFacets ? 'show' : 'hide';
    const plusMinusIcon = hideFacets ? 'minus' : 'plus';
    const hasExportLink = result && result.links && result.links.export;
    const exportLink = !hasExportLink ? null : result.links.export;
    const tooltip = intl.formatMessage(messages.alert_export_disabled);

    const operation = (
      <ButtonGroup>
        <Tooltip content={tooltip} disabled={exportLink}>
          <AnchorButton className="bp3-intent-primary" icon="download" disabled={!exportLink} href={exportLink}>
            <FormattedMessage id="search.screen.export" defaultMessage="Export" />
          </AnchorButton>
        </Tooltip>
      </ButtonGroup>
    );
    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Text icon="search">
          <FormattedMessage id="search.screen.breadcrumb" defaultMessage="Search" />
        </Breadcrumbs.Text>
        <Breadcrumbs.Text active>
          <ResultCount result={result} />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );

    const searchScopes = this.getSearchScopes();

    return (
      <Screen
        query={query}
        title={title}
        searchScopes={searchScopes}
        hotKeys={[
          {
            combo: 'j', global: true, label: 'Preview next search entity', onKeyDown: this.showNextPreview,
          },
          {
            combo: 'k', global: true, label: 'Preview previous search entity', onKeyDown: this.showPreviousPreview,
          },
          {
            combo: 'up', global: true, label: 'Preview previous search entity', onKeyDown: this.showPreviousPreview,
          },
          {
            combo: 'down', global: true, label: 'Preview next search entity', onKeyDown: this.showNextPreview,
          },
        ]}
      >
        {breadcrumbs}
        <DualPane className="SearchScreen">
          <DualPane.SidePane>
            <div
              role="switch"
              aria-checked={!hideFacets}
              tabIndex={0}
              className="visible-sm-flex facets total-count bp3-text-muted"
              onClick={this.toggleFacets}
              onKeyPress={this.toggleFacets}
            >
              <Icon icon={plusMinusIcon} />
              <span className="total-count-span">
                <FormattedMessage id="search.screen.filters" defaultMessage="Filters" />
              </span>
            </div>
            <div className={hideFacetsClass}>
              <SearchFacets
                query={query}
                result={result}
                updateQuery={this.updateQuery}
                facets={this.state.facets}
                isCollapsible
              />
            </div>
          </DualPane.SidePane>
          <DualPane.ContentPane className="padded">
            <SignInCallout />
            <QueryTags query={query} updateQuery={this.updateQuery} />
            <EntityTable
              query={query}
              updateQuery={this.updateQuery}
              result={result}
            />
            {result.total === 0 && (
              <ErrorSection
                icon="search"
                title={intl.formatMessage(messages.no_results_title)}
                resolver={<SuggestAlert queryText={query.state.q} />}
                description={intl.formatMessage(messages.no_results_description)}
              />
            )}
            <Waypoint
              onEnter={this.getMoreResults}
              bottomOffset="-400px"
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
  // We normally only want Things, not Intervals (relations between things).
  const context = {
    highlight: true,
    'filter:schemata': 'Thing',
  };
  const query = Query.fromLocation('entities', location, context, '');
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

const mapDispatchToProps = { queryEntities };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(SearchScreen);
