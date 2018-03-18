import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import Fragment from 'src/app/Fragment';
import { fetchFacet } from 'src/actions';
import CheckboxList from 'src/components/common/CheckboxList';

import './SearchFacet.css';

const messages = defineMessages({
  clear_filter: {
    id: 'search.facets.clear_filter',
    defaultMessage: 'Clear this filter',
  },
})

class SearchFacet extends Component {
  constructor(props)  {
    super(props);
    this.FACET_INCREMENT = 10;
    this.state = { facet: {} };
    this.onToggleOpen = this.onToggleOpen.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onClear = this.onClear.bind(this);
    this.showMore = this.showMore.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
    this.updateFromProps(this.props);
  }

  componentDidUpdate(prevProps, prevState) {
    this.fetchIfNeeded();
  }

  componentWillReceiveProps(nextProps) {
    this.updateFromProps(nextProps);
  }

  fetchIfNeeded() {
    const { fetchFacet, facetQuery, isBlocked } = this.props;
    const key = facetQuery.toKey();
    if (!isBlocked && this.state.key !== key) {
      this.setState({ key: key });
      fetchFacet({ query: facetQuery });
    }
  }

  updateFromProps(props) {
    const result = props.facet;
    if (result.total !== undefined && !result.isLoading) {
      this.setState({
        facet: result
      })
    }
  }

  updateFacetSize(facetSize) {
    const { fragment, field } = this.props;
    fragment.update({['facet:' + field]: facetSize});
  }

  showMore(event) {
    event.preventDefault();
    this.updateFacetSize(this.props.facetSize + this.FACET_INCREMENT);
  }

  onToggleOpen() {
    const defaultSize = this.props.defaultSize || this.FACET_INCREMENT;
    const newSize = this.props.facetSize > 0 ? 0 : defaultSize;
    this.updateFacetSize(newSize);
  }

  onSelect(value) {
    const { field } = this.props;
    let query = this.props.query;
    query = query.toggleFilter(field, value)
    this.props.updateQuery(query)
  }

  onClear(event) {
    event.stopPropagation();
    const { field } = this.props;
    let query = this.props.query;
    query = query.clearFilter(field);
    this.props.updateQuery(query);
  }

  render() {
    const { query, facetSize, isOpen, isBlocked, field, label, icon, intl } = this.props;
    const { facet } = this.state;
    const current = query ? query.getFilter(field) : null;
    const count = current ? current.length : 0;
    const isFiltered = query.getFilter(field).length > 0;
    
    // The values array can include extra selected-but-zero-hit values that are
    // excluded from total, so we compare not against the array's length but
    // against the requested limit.
    const hasMoreValues = facetSize < facet.total;
    const isUpdating = isBlocked || this.props.facet.total === undefined;
    const isExpanding  = facet.values === undefined || (facet.total !== 0 && facet.values.length < Math.min(facet.total || 10000, facetSize));

    return (
      <div className="SearchFacet">
        <div className={c('opener', { clickable: !!facet.total, active: isFiltered })} onClick={this.onToggleOpen} style={{position: 'relative'}}>
          <Icon icon={`caret-right`} className={c('caret', {rotate: isOpen})} />
          <span className="FacetName">
            <span className={`FacetIcon pt-icon pt-icon-${icon}`}/>  
            {label} 
          </span>     
            
          {isFiltered && (
            <React.Fragment>
              <span className="FilterCount pt-text-muted">
                <FormattedMessage id="search.facets.filtersSelected"
                  defaultMessage="{count} selected"
                  values={{ count: intl.formatNumber(count) }}
                  />
              </span>
              <Button onClick={this.onClear}
                className="ClearButton pt-minimal pt-small"
                title={intl.formatMessage(messages.clear_filter)} icon="cross"></Button>
            </React.Fragment>
          )}

          {!isFiltered && (
            <React.Fragment>
              {isUpdating && (
                <span className="pt-tag pt-small pt-round pt-minimal">…</span>
              )}

              {facet.total === 0 && (
                <span className="pt-tag pt-small pt-round pt-minimal">0</span>
              )}

              {facet.total > 0 && (
                <span className="pt-tag pt-small pt-round pt-intent-primary">
                  <FormattedNumber value={facet.total} />
                </span>
              )}
            </React.Fragment>
          )} 
        </div>
        <Collapse isOpen={isOpen}>
          {facet.values !== undefined && (
            <CheckboxList items={facet.values}
                          selectedItems={current}
                          onItemClick={this.onSelect}>
              {hasMoreValues && (
                <a className="ShowMore" onClick={this.showMore}>
                  <FormattedMessage id="search.facets.showMore"
                                    defaultMessage="Show more…"
                                    style={{paddingTop: 10}}/>
                </a>
              )}
            </CheckboxList>
          )}
          {(isExpanding && isOpen) && (
            <Spinner className="pt-small spinner" />
          )}
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const fragment = Fragment.fromLocation(ownProps.location, ownProps.history),
        defaultSize = ownProps.defaultSize || 0,
        facetSize = fragment.get('facet:' + ownProps.field) || defaultSize,
        isOpen = facetSize > 0;

  // this is hacky: block loading the facet until the main query result
  // is pending, so the main result loads before the facets.
  const isBlocked = state.results[ownProps.query.toKey()] === undefined;
  
  const facetQuery = ownProps.query
      .limit(0) // The limit of the results, not the facets.
      .clear('offset')
      .sortBy(null)
      .clearFacets()
      .addFacet(ownProps.field)
      .clearFilter(ownProps.field)
      .set('facet_total', true)
      .set('facet_values', isOpen)
      .set('facet_size', facetSize);

  const facet = state.facets[facetQuery.toKey()] || {};

  return {
    facet: facet[ownProps.field] || {},
    facetSize: facetSize,
    facetQuery: facetQuery,
    isBlocked: isBlocked,
    isOpen: isOpen,
    fragment: fragment
  };
};

SearchFacet = injectIntl(SearchFacet);
SearchFacet = connect(mapStateToProps, { fetchFacet })(SearchFacet);
SearchFacet = withRouter(SearchFacet);
export default SearchFacet;
