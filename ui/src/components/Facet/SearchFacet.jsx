import React, { Component } from 'react';
import {
  FormattedMessage, FormattedNumber, injectIntl,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import { CheckboxList, Schema } from 'components/common';
import DateFacet from 'components/Facet/DateFacet';

import './SearchFacet.scss';

const defaultFacet = {};


class SearchFacet extends Component {
  constructor(props) {
    super(props);
    this.state = { facet: defaultFacet, isExpanding: false };
    this.onToggleOpen = this.onToggleOpen.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onClear = this.onClear.bind(this);
    this.renderList = this.renderList.bind(this);
    this.renderDates = this.renderDates.bind(this);
    this.showMore = this.showMore.bind(this);
  }

  static getDerivedStateFromProps(nextProps) {
    const { field, result } = nextProps;
    if (result.total !== undefined && !result.isPending) {
      const facets = result.facets || {};
      return {
        facet: facets[field] || defaultFacet,
        isExpanding: false,
      };
    }
    return null;
  }

  onToggleOpen() {
    console.log('calling toggle open')
    const { isOpen, defaultSize } = this.props;
    const newSize = isOpen ? undefined : defaultSize;
    this.updateFacetSize(newSize);
  }

  onSelect(value) {
    const { field, query } = this.props;
    this.props.updateQuery(query.toggleFilter(field, value));
  }

  onClear(event) {
    event.stopPropagation();
    const { field, query } = this.props;
    this.props.updateQuery(query.clearFilter(field));
  }

  updateFacetSize(newSize) {
    const { query, field } = this.props;
    const isDate = field === 'dates';

    let newQuery = query.set(`facet_size:${field}`, newSize);
    if (!newSize) {
      newQuery = newQuery.remove('facet', field);
      newQuery = newQuery.add(`facet_total:${field}`, undefined);
      newQuery = newQuery.set(`facet_size:${field}`, undefined);
      if (isDate) {
        newQuery = newQuery.remove('facet_interval:dates', 'year');
      }
    } else {
      newQuery = newQuery.add('facet', field);
      newQuery = newQuery.add(`facet_total:${field}`, true);
      if (isDate) {
        newQuery = newQuery.add('facet_interval:dates', 'year');
      }
    }
    this.props.updateQuery(newQuery);
    this.setState({ isExpanding: true });
  }

  showMore(event) {
    event.preventDefault();
    const { facetSize, defaultSize } = this.props;
    this.updateFacetSize(facetSize + defaultSize);
  }

  renderDates() {
    const { facet, query, result } = this.props;

    console.log('facet is', facet, result);

    return (
      <DateFacet
        isOpen={true}
        intervals={result?.facets?.dates?.intervals}
        query={query}
        updateQuery={this.props.updateQuery}
      />
    );
  }

  renderList(selectedItems) {
    const { facet, facetSize, field } = this.props;
    const isMultiSelect = field !== 'schema';
    const hasMoreValues = facetSize < facet.total;

    const values = field === 'schema'
      ? facet?.values?.map(({ id, label, ...rest }) => ({ label: <Schema.Label schema={id} icon />, id, ...rest }))
      : facet?.values;

    if (values !== undefined) {
      return (
        <CheckboxList
          items={values}
          selectedItems={selectedItems}
          onItemClick={this.onSelect}
          isMultiSelect={isMultiSelect}
        >
          {hasMoreValues && (
            <a className="ShowMore" onClick={this.showMore} href="/">
              <FormattedMessage
                id="search.facets.showMore"
                defaultMessage="Show more…"
                style={{ paddingTop: 10 }}
              />
            </a>
          )}
        </CheckboxList>
      );
    }
    return null;
  }

  render() {
    const {
      query, facetSize, isOpen, result, field, label, intl, isCollapsible,
    } = this.props;
    const { facet, isExpanding } = this.state;
    const current = query.getFilter(field);
    const count = current ? current.length : 0;
    const isFiltered = query.getFilter(field).length > 0;
    const isUpdating = result.total === undefined;
    const isDate = field === 'dates';

    return (
      <div className="SearchFacet">
        <div
          className={c('opener', { clickable: isCollapsible, active: !isUpdating && isFiltered })}
          onClick={this.onToggleOpen}
          onKeyPress={this.onToggleOpen}
          tabIndex={0}
          style={{ position: 'relative' }}
          role="switch"
          aria-checked={isOpen}
        >
          {isCollapsible && (
            <Icon icon="caret-right" className={c('caret', { rotate: isOpen })} />
          )}
          <span className="FacetName">
            {label}
          </span>

          {isFiltered && (
            <>
              <span className="FilterCount bp3-text-muted">
                <FormattedMessage
                  id="search.facets.filtersSelected"
                  defaultMessage="{count} selected"
                  values={{ count: intl.formatNumber(count) }}
                />
              </span>
            </>
          )}

          {(!isDate && isOpen) && (
            <>
              {facet.total === 0 && (
                <span className="bp3-tag bp3-small bp3-round bp3-minimal">0</span>
              )}

              {facet.total > 0 && (
                <span className="bp3-tag bp3-small bp3-round">
                  <FormattedNumber value={facet.total} />
                </span>
              )}
            </>
          )}
        </div>
        <Collapse isOpen={isOpen} className={c({ updating: isUpdating })}>
          {isDate && this.renderDates()}
          {!isDate && this.renderList(current)}
          {(isExpanding && isOpen) && (
            <Spinner className="bp3-small spinner" />
          )}
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query, facet } = ownProps;
  const field = facet.isProperty ? `properties.${facet.field}` : facet.field
  const defaultSize = facet.defaultSize || 10;
  const facetSize = query.getInt(`facet_size:${field}`, 0);
  const isOpen = query.hasFacet(field) && facetSize > 0;
  return {
    facetSize,
    field,
    defaultSize,
    isOpen,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(SearchFacet);
