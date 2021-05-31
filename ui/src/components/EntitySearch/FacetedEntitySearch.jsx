import React from 'react';
import queryString from 'query-string';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Icon, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { setSearchConfig, getSearchConfig } from 'app/storage';
import getFacetConfig from 'util/getFacetConfig';
import { Count, DualPane, ErrorSection, HotkeysContainer } from 'components/common';
import EntitySearch from 'components/EntitySearch/EntitySearch';
import FacetConfigDialog from 'dialogs/FacetConfigDialog/FacetConfigDialog';
import SearchActionBar from 'components/common/SearchActionBar';
import SearchFacets from 'components/Facet/SearchFacets';
import SearchFieldSelect from 'components/EntitySearch/SearchFieldSelect';
import QueryTags from 'components/QueryTags/QueryTags';
import togglePreview from 'util/togglePreview';
import SortingBar from 'components/SortingBar/SortingBar';
import SortingBarSelect from 'components/SortingBar/SortingBarSelect';
import { DialogToggleButton } from 'components/Toolbar'

import './FacetedEntitySearch.scss';

const defaultFacetKeys = [
  'dates', 'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses',
];
const defaultColumns = ['caption', 'collection_id', 'countries', 'dates'];

const messages = defineMessages({
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
  configure_facets: {
    id: 'search.facets.configure',
    defaultMessage: 'Configure filters',
  },
  columns: {
    id: 'search.columns.configure',
    defaultMessage: 'Columns {count}'
  }
});

class FacetedEntitySearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hideFacets: false,
    };

    this.updateQuery = this.updateQuery.bind(this);
    this.toggleFacets = this.toggleFacets.bind(this);
    this.getCurrentPreviewIndex = this.getCurrentPreviewIndex.bind(this);
    this.onSearchConfigEdit = this.onSearchConfigEdit.bind(this);
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

  onSearchConfigEdit(configKey, edited) {
    const { columns, facets, history, location } = this.props;
    const current = this.props[configKey];
    let next;

    if (current.find(({ field }) => field === edited.field)) {
      next = current.filter(({ field }) => field !== edited.field);;
    } else {
      next = [...current, edited]
    }

    setSearchConfig({ columns, facets, [configKey]: next });

    history.replace({
      pathname: location.pathname,
      hash: location.hash,
    });
  }

  render() {
    const { additionalFacets = [], columns, children, facets, query, result, intl } = this.props;
    const { hideFacets } = this.state;
    const hideFacetsClass = hideFacets ? 'show' : 'hide';
    const plusMinusIcon = hideFacets ? 'minus' : 'plus';
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
              <SearchFieldSelect
                onSelect={(field) => this.onSearchConfigEdit('facets', field)}
                selected={facets}
              >
                <Button icon="filter-list" text={intl.formatMessage(messages.configure_facets)} />
              </SearchFieldSelect>
            </div>
          </DualPane.SidePane>
          <DualPane.ContentPane>
            {children}
            <div className="FacetedEntitySearch__controls">
              <QueryTags query={query} updateQuery={this.updateQuery} />
              <SearchActionBar result={result}>
                <SortingBar
                  query={query}
                  updateQuery={this.updateQuery}
                  sortingFields={columns}
                  filterButtonLabel=""
                  filterButton={
                    <SearchFieldSelect
                      onSelect={(field) => this.onSearchConfigEdit('columns', field)}
                      selected={facets}
                    >
                      <Button
                        text={intl.formatMessage(messages.columns, { count: <Count count={columns.length} className='bp3-intent-primary' /> })}
                        minimal
                        intent={Intent.PRIMARY}
                        rightIcon="caret-down"
                      />
                    </SearchFieldSelect>
                  }
                />
              </SearchActionBar>
            </div>
            <EntitySearch
              query={query}
              updateQuery={this.updateQuery}
              result={result}
              emptyComponent={empty}
              defaultColumns={columns}
            />
          </DualPane.ContentPane>
        </DualPane>
      </HotkeysContainer>
    );
  }
}
const mapStateToProps = () => {
  const searchConfig = getSearchConfig();
  return {
    facets: searchConfig?.facets || defaultFacetKeys.map(getFacetConfig),
    columns: searchConfig?.columns || defaultColumns
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(FacetedEntitySearch);
