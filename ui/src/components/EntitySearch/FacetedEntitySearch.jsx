import React from 'react';
import queryString from 'query-string';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { AnchorButton, Icon, Tooltip } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { triggerQueryExport } from 'src/actions';
import { DualPane, ErrorSection, HotKeysContainer } from 'components/common';
import EntitySearch from 'components/EntitySearch/EntitySearch';
import SearchFacets from 'components/Facet/SearchFacets';
import DateFacet from 'components/Facet/DateFacet';
import QueryTags from 'components/QueryTags/QueryTags';
import togglePreview from 'util/togglePreview';

import './FacetedEntitySearch.scss';

const defaultFacets = [
  'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes',
];

const messages = defineMessages({
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
  date_facet_show: {
    id: 'search.screen.show_dates',
    defaultMessage: 'Show date filter',
  },
  date_facet_hide: {
    id: 'search.screen.hide_dates',
    defaultMessage: 'Hide date filter',
  },
  date_facet_disabled: {
    id: 'search.screen.dates_disabled',
    defaultMessage: 'No dates available',
  },
});

export class FacetedEntitySearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hideFacets: false,
    };

    this.updateQuery = this.updateQuery.bind(this);
    this.toggleFacets = this.toggleFacets.bind(this);
    this.toggleDateFacet = this.toggleDateFacet.bind(this);
    this.getCurrentPreviewIndex = this.getCurrentPreviewIndex.bind(this);
    this.showNextPreview = this.showNextPreview.bind(this);
    this.showPreviousPreview = this.showPreviousPreview.bind(this);
    this.showPreview = this.showPreview.bind(this);
  }

  getCurrentPreviewIndex() {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    return this.props.result.results.findIndex(
      entity => entity.id === parsedHash['preview:id'],
    );
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

  toggleDateFacet() {
    const { dateFacetIsOpen, query } = this.props;
    let newQuery;
    if (dateFacetIsOpen) {
      newQuery = query.remove('facet', 'dates')
        .remove('facet_interval:dates', 'year');
    } else {
      newQuery = query.add('facet', 'dates')
        .add('facet_interval:dates', 'year');
    }
    this.updateQuery(newQuery);
  }

  render() {
    const { additionalFacets = [], children, dateFacetIsOpen, dateFacetIntervals, query, result, intl } = this.props;
    const { hideFacets } = this.state;
    const hideFacetsClass = hideFacets ? 'show' : 'hide';
    const plusMinusIcon = hideFacets ? 'minus' : 'plus';
    const noResults = !result.isPending && result.total === 0;
    const dateFacetDisabled = dateFacetIntervals && (noResults || dateFacetIntervals.length <= 1);
    const facets = [...additionalFacets, ...defaultFacets];

    const empty = (
      <ErrorSection
        icon="search"
        title={intl.formatMessage(messages.no_results_title)}
        description={intl.formatMessage(messages.no_results_description)}
      />
    );

    return (
      <HotKeysContainer
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
        <DualPane className="FacetedEntitySearch">
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
                facets={facets}
                isCollapsible
              />
            </div>
          </DualPane.SidePane>
          <DualPane.ContentPane>
            {children}
            <div className="FacetedEntitySearch__control-bar">
              <div className="FacetedEntitySearch__control-bar__inner-container">
                <div className="FacetedEntitySearch__control-bar__button">
                  {!noResults && (
                    <Tooltip
                      content={intl.formatMessage(
                        dateFacetDisabled ? messages.date_facet_disabled : (
                          dateFacetIsOpen ? messages.date_facet_hide : messages.date_facet_show
                        )
                      )}
                    >
                      <AnchorButton
                        outlined
                        icon="calendar"
                        onClick={this.toggleDateFacet}
                        disabled={dateFacetDisabled}
                        active={dateFacetIsOpen}
                      />
                    </Tooltip>
                  )}
                </div>
                <QueryTags query={query} updateQuery={this.updateQuery} />
              </div>
            </div>
            <DateFacet
              isOpen={dateFacetDisabled ? false : dateFacetIsOpen}
              intervals={dateFacetIntervals}
              query={query}
              updateQuery={this.updateQuery}
            />
            <EntitySearch
              query={query}
              updateQuery={this.updateQuery}
              result={result}
              emptyComponent={empty}
            />
          </DualPane.ContentPane>
        </DualPane>
      </HotKeysContainer>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query, result } = ownProps;

  const dateFacetIsOpen = query.hasFacet('dates')
  const dateFacetIntervals = result?.facets?.dates?.intervals;
  return { dateFacetIsOpen, dateFacetIntervals };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { triggerQueryExport }),
  injectIntl,
)(FacetedEntitySearch);
