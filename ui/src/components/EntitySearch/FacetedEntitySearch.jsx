import React from 'react';
import queryString from 'query-string';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Icon } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { getCustomFacets } from 'app/storage';
import getFacetConfig from 'util/getFacetConfig';
import { DualPane, ErrorSection, HotkeysContainer } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar'
import EntitySearch from 'components/EntitySearch/EntitySearch';
import EntitySearchManageMenu from 'components/EntitySearch/EntitySearchManageMenu';
import SearchActionBar from 'components/common/SearchActionBar';
import SearchFacets from 'components/Facet/SearchFacets';
import DateFacet from 'components/Facet/DateFacet';
import QueryTags from 'components/QueryTags/QueryTags';
import FacetConfigDialog from 'dialogs/FacetConfigDialog/FacetConfigDialog';
import togglePreview from 'util/togglePreview';

import './FacetedEntitySearch.scss';

const defaultFacetKeys = [
  'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses',
];

const messages = defineMessages({
  configure_facets: {
    id: 'search.facets.button_text',
    defaultMessage: 'Configure facets',
  },
  no_results_title: {
    id: 'search.no_results_title',
    defaultMessage: 'No search results',
  },
  no_results_description: {
    id: 'search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
  group_label: {
    id: 'hotkeys.search.group_label',
    defaultMessage: 'Search preview'
  },
  next: {
    id: 'hotkeys.search.unsure',
    defaultMessage: 'Preview next result'
  },
  previous: {
    id: 'hotkeys.search.different',
    defaultMessage: 'Preview previous result'
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

  render() {
    const { additionalFacets = [], children, dateFacetIsOpen, dateFacetIntervals, facets, query, result, intl } = this.props;
    const { hideFacets } = this.state;
    const hideFacetsClass = hideFacets ? 'show' : 'hide';
    const plusMinusIcon = hideFacets ? 'minus' : 'plus';
    const noResults = !result.isPending && result.total === 0;
    const dateFacetDisabled = result.isPending || noResults || (dateFacetIsOpen && (!dateFacetIntervals || dateFacetIntervals.length <= 1));
    const fullFacetList = [...additionalFacets.map(getFacetConfig), ...facets];

    const empty = (
      <ErrorSection
        icon="search"
        title={intl.formatMessage(messages.no_results_title)}
        description={intl.formatMessage(messages.no_results_description)}
      />
    );

    const hotkeysGroupLabel = { group: intl.formatMessage(messages.group_label) }

    return (
      <HotkeysContainer
        hotkeys={[
          {
            combo: 'j', label: intl.formatMessage(messages.next), onKeyDown: this.showNextPreview, ...hotkeysGroupLabel
          },
          {
            combo: 'k', label: intl.formatMessage(messages.previous), onKeyDown: this.showPreviousPreview, ...hotkeysGroupLabel
          },
          {
            combo: 'up', label: intl.formatMessage(messages.previous), onKeyDown: this.showPreviousPreview, ...hotkeysGroupLabel
          },
          {
            combo: 'down', label: intl.formatMessage(messages.next), onKeyDown: this.showNextPreview, ...hotkeysGroupLabel
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
                facets={fullFacetList}
                isCollapsible
              />
              <DialogToggleButton
                buttonProps={{
                  text: intl.formatMessage(messages.configure_facets),
                  icon: "filter-list"
                }}
                Dialog={FacetConfigDialog}
                dialogProps={{ facets }}
              />
            </div>
          </DualPane.SidePane>
          <DualPane.ContentPane>
            {children}
            <div className="FacetedEntitySearch__controls">
              <QueryTags query={query} updateQuery={this.updateQuery} />
              <SearchActionBar result={result}>
                <EntitySearchManageMenu
                  query={query}
                  dateFacetDisabled={dateFacetDisabled}
                  dateFacetIsOpen={dateFacetIsOpen}
                  updateQuery={this.updateQuery}
                />
              </SearchActionBar>
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
      </HotkeysContainer>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query, result } = ownProps;

  return {
    dateFacetIsOpen: query.hasFacet('dates'),
    dateFacetIntervals: result?.facets?.dates?.intervals,
    facets: getCustomFacets() || defaultFacetKeys.map(getFacetConfig)
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(FacetedEntitySearch);
