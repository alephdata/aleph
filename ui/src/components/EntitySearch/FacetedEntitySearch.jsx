import React from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Icon } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { triggerQueryExport } from 'src/actions';
import { setSearchConfig, getSearchConfig } from 'app/storage';
import { getGroupField } from 'components/SearchField/util';
import { DualPane, ErrorSection, HotkeysContainer } from 'components/common';
import EntitySearch from 'components/EntitySearch/EntitySearch';
import SearchActionBar from 'components/common/SearchActionBar';
import Facets from 'components/Facet/Facets';
import SearchFieldSelect from 'components/SearchField/SearchFieldSelect';
import QueryTags from 'components/QueryTags/QueryTags';
import togglePreview from 'util/togglePreview';

import './FacetedEntitySearch.scss';

const defaultFacets = [
  'dates', 'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses',
];
const defaultColumns = ['countries', 'dates'];

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
  configure_facets_placeholder: {
    id: 'search.facets.configure_placeholder',
    defaultMessage: 'Search for a filter...',
  },
  configure_columns: {
    id: 'search.columns.configure',
    defaultMessage: 'Configure columns'
  },
  configure_columns_placeholder: {
    id: 'search.columns.configure_placeholder',
    defaultMessage: 'Search for a column...',
  },
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
    const { columns, facets } = this.props;
    const current = this.props[configKey];
    let next;

    if (current.find(({ name }) => name === edited.name)) {
      next = current.filter(({ name }) => name !== edited.name);;
    } else {
      next = [...current, edited]
    }

    this.saveSearchConfig({ columns, facets, [configKey]: next });
  }

  saveSearchConfig(config) {
    const { history, location } = this.props;

    setSearchConfig(config);

    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }

  render() {
    const { additionalFields = [], columns, children, facets, query, result, intl, hasCustomColumns, hasCustomFacets } = this.props;
    const { hideFacets } = this.state;
    const hideFacetsClass = hideFacets ? 'show' : 'hide';
    const plusMinusIcon = hideFacets ? 'minus' : 'plus';

    const empty = (
      <ErrorSection
        icon="search"
        title={intl.formatMessage(messages.no_results_title)}
        description={intl.formatMessage(messages.no_results_description)}
      />
    );

    const exportLink = result.total > 0 ? result.links?.export : null;

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
              <Facets
                query={query}
                result={result}
                updateQuery={this.updateQuery}
                facets={[...additionalFields.map(getGroupField), ...facets]}
                isCollapsible
              />
              <SearchFieldSelect
                filterPropOptions={prop => prop.type.name !== 'entity'}
                onSelect={(field) => this.onSearchConfigEdit('facets', field)}
                onReset={hasCustomFacets && (() => this.saveSearchConfig({ facets: null, columns }))}
                selected={facets}
                inputProps={{ placeholder: intl.formatMessage(messages.configure_facets_placeholder) }}
              >
                <Button icon="filter-list" text={intl.formatMessage(messages.configure_facets)} />
              </SearchFieldSelect>
            </div>
          </DualPane.SidePane>
          <DualPane.ContentPane>
            {children}
            <div className="FacetedEntitySearch__controls">
              <QueryTags query={query} updateQuery={this.updateQuery} />
              <SearchActionBar
                result={result}
                exportDisabled={!exportLink}
                onExport={() => this.props.triggerQueryExport(exportLink)}
              >
                <div className="SearchActionBar__secondary">
                  <SearchFieldSelect
                    onSelect={(field) => this.onSearchConfigEdit('columns', field)}
                    onReset={hasCustomColumns && (() => this.saveSearchConfig({ columns: null, facets }))}
                    selected={columns}
                    inputProps={{ placeholder: intl.formatMessage(messages.configure_columns_placeholder) }}
                  >
                    <Button
                      icon='two-columns'
                      text={intl.formatMessage(messages.configure_columns)}
                    />
                  </SearchFieldSelect>
                </div>
              </SearchActionBar>
            </div>
            <EntitySearch
              query={query}
              updateQuery={this.updateQuery}
              result={result}
              emptyComponent={empty}
              columns={[...additionalFields.map(getGroupField), ...columns]}
            />
          </DualPane.ContentPane>
        </DualPane>
      </HotkeysContainer>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const searchConfig = getSearchConfig();
  const facets = searchConfig?.facets || defaultFacets.map(getGroupField);
  const columns = searchConfig?.columns || defaultColumns.map(getGroupField);

  // add any active facets to the list of displayed columns
  const activeFacetKeys = query.getList('facet');
  const activeFacets = activeFacetKeys
    .map(key => {
      const sanitizedKey = key.replace('properties.', '');
      return facets.find(facet => facet.name === sanitizedKey);
    })
    .filter(facet => !!facet);

  return {
    hasCustomFacets: !!searchConfig?.facets,
    hasCustomColumns: !!searchConfig?.columns,
    facets,
    columns: _.uniqBy([...columns, ...activeFacets], facet => facet.name)
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { triggerQueryExport }),
  injectIntl,
)(FacetedEntitySearch);
