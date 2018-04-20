import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import { fetchFacet } from 'src/actions';
import { CheckboxList } from 'src/components/common';

import './SearchFacet.css';

const messages = defineMessages({
  clear_filter: {
    id: 'search.facets.clear_filter',
    defaultMessage: 'Clear this filter',
  },
})

const defaultFacet = {}

class SearchFacet extends Component {
  constructor(props)  {
    super(props);
    this.state = {facet: defaultFacet, isExpanding: false};
    this.FACET_INCREMENT = 10;
    this.onToggleOpen = this.onToggleOpen.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onClear = this.onClear.bind(this);
    this.showMore = this.showMore.bind(this);
  }

  componentDidMount() {
    this.updateFacet(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.updateFacet(nextProps);
  }

  updateFacet(props) {
    const { field, result, isOpen } = props;
    if (isOpen && !result.isLoading) {
      const facets = result.facets || {};
      const facet = facets[field] || defaultFacet;
      this.setState({facet, isExpanding: false});
    }
  }

  updateFacetSize(newSize) {
    const { query, field } = this.props;
    let newQuery = query.set('facet_size:' + field, newSize);
    if (!newSize) {
      newQuery = newQuery.remove('facet', field);
      newQuery = newQuery.add('facet_total:' + field, undefined);
      newQuery = newQuery.set('facet_size:' + field, undefined);
    } else { 
      newQuery = newQuery.add('facet', field);
      newQuery = newQuery.add('facet_total:' + field, true);
    }
    this.props.updateQuery(newQuery);
    this.setState({isExpanding: true});
  }

  showMore(event) {
    event.preventDefault();
    this.updateFacetSize(this.props.facetSize + this.FACET_INCREMENT);
  }

  onToggleOpen() {
    const { isOpen, facetSize } = this.props;
    const newSize = isOpen ? undefined : (facetSize || this.FACET_INCREMENT);
    this.updateFacetSize(newSize);
  }

  onSelect(value) {
    const { field } = this.props;
    this.props.updateQuery(this.props.query.toggleFilter(field, value));
  }

  onClear(event) {
    event.stopPropagation();
    const { field } = this.props;
    this.props.updateQuery(this.props.query.clearFilter(field));
  }

  render() {
    const { query, facetSize, isOpen, result, field, label, icon, intl } = this.props;
    const { facet, isExpanding } = this.state;
    const current = query.getFilter(field);
    const count = current ? current.length : 0;
    const isFiltered = query.getFilter(field).length > 0;
    
    // The values array can include extra selected-but-zero-hit values that are
    // excluded from total, so we compare not against the array's length but
    // against the requested limit.
    const hasMoreValues = facetSize < facet.total;
    const isUpdating = result.isLoading;
    // const isExpanding  = facet.values === undefined || (facet.total !== 0 && facet.values.length < Math.min(facet.total || 10000, facetSize));

    return (
      <div className="SearchFacet">
        <div className={c('opener clickable', { active: !isUpdating && isFiltered })} onClick={this.onToggleOpen} style={{position: 'relative'}}>
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
                title={intl.formatMessage(messages.clear_filter)} icon="cross"/>
            </React.Fragment>
          )}

          {isOpen && !isFiltered && (
            <React.Fragment>
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
          <Collapse isOpen={isOpen} className={c({updating: isUpdating})}>
          {facet.values !== undefined && (
            <CheckboxList items={facet.values}
                          selectedItems={current}
                          onItemClick={this.onSelect}
                          >
              {!isUpdating && hasMoreValues && (
                <a className="ShowMore" onClick={this.showMore}>
                  <FormattedMessage id="search.facets.showMore"
                                    defaultMessage="Show more…"
                                    style={{paddingTop: 10}}/>
                </a>
              )}
            </CheckboxList>
          )}
          {((isUpdating || isExpanding) && isOpen) && (
            <Spinner className="pt-small spinner" />
          )}
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query, field, defaultSize } = ownProps;
  const facetSize = query.getInt('facet_size:' + field, defaultSize),
        isOpen = query.hasFacet(field) && facetSize > 0;

  return {
    facetSize: facetSize,
    defaultSize: defaultSize,
    isOpen: isOpen
  };
};

SearchFacet = injectIntl(SearchFacet);
SearchFacet = connect(mapStateToProps, { fetchFacet })(SearchFacet);
SearchFacet = withRouter(SearchFacet);
export default SearchFacet;
