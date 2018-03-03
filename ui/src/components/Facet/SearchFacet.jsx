import React, { Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

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

    this.state = {
      isOpen: !!props.initiallyOpen,
      facetSize: 10,
      loadKey: null
    };

    this.onClick = this.onClick.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onClear = this.onClear.bind(this);
    this.isActive = this.isActive.bind(this);
    this.showMore = this.showMore.bind(this);
  }

  componentDidMount() {
    this.updateState();
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateState();
  }

  facetQuery() {
    return this.props.query
      .limit(0) // The limit of the results, not the facets.
      .clear('offset')
      .sortBy(null)
      .clearFacets()
      .addFacet(this.props.field)
      .clearFilter(this.props.field)
      .set('facet_total', true)
      .set('facet_values', this.state.isOpen)
      .set('facet_size', this.state.facetSize);
  }

  updateState() {
    const { field, facets, fetchFacet } = this.props;
    const query = this.facetQuery(),
          key = query.toKey();
    if (this.state.loadKey !== key) {
      this.setState({
        loadKey: key
      })
      fetchFacet({ query });
    }
  }

  isActive(props = this.props) {
    return props.query ? props.query.getFilter(props.field).length > 0 : false;
  }

  showMore(event) {
    event.preventDefault();
    this.setState({
      facetSize: this.state.facetSize * 2
    })
  }

  onClick() {
    this.setState(
      state => ({ ...state, isOpen: !state.isOpen }),
    );
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
    const key = this.facetQuery().toKey();
    const { query, facets, field, label, icon, intl } = this.props;
    const { isOpen, facetSize } = this.state;
    const facet = facets[key] ? facets[key][field] : {};
    const isFetchingValues = facet.values === undefined;
    const isExpandingValues = !isFetchingValues && facet.values.length < Math.min(facet.total, facetSize);
    const current = query ? query.getFilter(field) : null;
    const count = current ? current.length : 0;
    const isActive = this.isActive();
    
    // The values array can include extra selected-but-zero-hit values that are
    // excluded from total, so we compare not against the array's length but
    // against the requested limit.
    const hasMoreValues = this.state.facetSize < facet.total;

    return (
      <div className="SearchFacet">
        <div className={c('opener', { clickable: !!facet.total, active: isActive })} onClick={this.onClick} style={{position: 'relative'}}>
          <Icon icon={`caret-right`} className={c('caret', {rotate: isOpen})} />
          <span className="FacetName">
            <span className={`FacetIcon pt-icon pt-icon-${icon}`}/>  
            {label} 
          </span>     
            
          {isActive && count > 0 && facet.total !== undefined && facet.total > 0 && (
            <span className="FilterCount pt-text-muted">
              <FormattedMessage id="search.facets.filtersSelected"
                defaultMessage="{count} selected"
                values={{ count: intl.formatNumber(count) }}
                />
            </span>
          )}

          {isActive && facet.total === undefined && (
            <span className="pt-tag pt-small pt-round pt-minimal">…</span>
          )}

          {!isActive && facet.total !== undefined && facet.total === 0 && (
            <span className="pt-tag pt-small pt-round pt-minimal">0</span>
          )}

          {!isActive && facet.total !== undefined && facet.total > 0 && (
            <span className="pt-tag pt-small pt-round pt-intent-primary">
              <FormattedNumber value={facet.total} />
            </span>
          )}
          
          {isActive && !isFetchingValues && !isExpandingValues && (
            <Button onClick={this.onClear}
              className="ClearButton pt-minimal pt-small"
              title={intl.formatMessage(messages.clear_filter)} icon="cross"></Button>
          )}
        </div>
        <Collapse isOpen={isOpen}>
          {facet.values !== undefined && (
            <CheckboxList items={facet.values}
                          selectedItems={current}
                          onItemClick={this.onSelect}>
              {!isFetchingValues && !isExpandingValues && hasMoreValues && (
                <a className="ShowMore" onClick={this.showMore}>
                  <FormattedMessage id="search.facets.showMore"
                                    defaultMessage="Show more…"
                                    style={{paddingTop: 10}}/>
                </a>
              )}
            </CheckboxList>
          )}
          {(isFetchingValues || isExpandingValues) && (
            <Spinner className="pt-small spinner" />
          )}
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { facets: state.facets };
};

SearchFacet = injectIntl(SearchFacet);
SearchFacet = connect(mapStateToProps, { fetchFacet })(SearchFacet);
export default SearchFacet;
