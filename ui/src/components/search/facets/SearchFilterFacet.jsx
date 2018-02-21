import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import messages from 'src/content/messages';
import { fetchFacet, fetchNextFacetValues } from 'src/actions';
import { selectFacet } from 'src/selectors';
import CheckboxList from './CheckboxList';

import './SearchFilterFacet.css';

class SearchFilterFacet extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      isOpen: props.initiallyOpen !== undefined ? props.initiallyOpen : this.isActive(),
    };

    this.onClick = this.onClick.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onClear = this.onClear.bind(this);
    this.isActive = this.isActive.bind(this);
    this.showMore = this.showMore.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps, prevState) {
    // Check for a change of query, as unconditionally calling fetchIfNeeded
    // could cause an infinite loop (if fetching fails).
    if (!this.props.query.sameAs(prevProps.query)
      || this.state.isOpen !== prevState.isOpen) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const { total, values, isFetchingTotal, isFetchingValues, fetchFacet } = this.props;
    const { isOpen } = this.state;
    const fetchTotal = total === undefined && !isFetchingTotal;
    const fetchValues = isOpen && values === undefined && !isFetchingValues;
    if (fetchTotal || fetchValues) {
      const { query, field } = this.props;
      fetchFacet({ query, field, fetchTotal, fetchValues });
    }
  }

  isActive(props = this.props) {
    return props.query.getFilter(props.field).length > 0;
  }

  showMore() {
    const { query, field, fetchNextFacetValues } = this.props;
    fetchNextFacetValues({ query, field });
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
    const { query, field, total, values, isFetchingValues,
            isExpandingValues, valuesLimit, intl } = this.props;
    const { isOpen } = this.state;

    const current = query.getFilter(field);
    const count = current.length;
    const isActive = this.isActive();
    const fieldLabel = messages.search.filter[field]
      ? intl.formatMessage(messages.search.filter[field])
      : field;

    // The values array can include extra selected-but-zero-hit values that are
    // excluded from total, so we compare not against the array's length but
    // against the requested limit.
    const hasMoreValues = valuesLimit < total;

    return (
      <div className="SearchFilterFacet">
        <div className={c('opener', { clickable: !!total, active: isActive })} onClick={this.onClick}>
          <Icon icon={`caret-right`} className={c('caret', {rotate: isOpen})} />
          <span className="text">
            {isActive
              ? total !== undefined
                ? <FormattedMessage id="search.facets.filteringBy" defaultMessage="Filtering by {count} of {total} {fieldLabel}" values={{ fieldLabel, count, total }} />
                : <FormattedMessage id="search.facets.filteringByNoTotal" defaultMessage="Filtering by {count} {fieldLabel}" values={{ fieldLabel, count }} />
              : total !== undefined
                ? <FormattedMessage id="search.facets.filterBy" defaultMessage="Found {total} {fieldLabel}" values={{ fieldLabel, total }} />
                : <FormattedMessage id="search.facets.countingTotal" defaultMessage="Counting {fieldLabel}…" values={{ fieldLabel }} />
            }
          </span>
          {isActive && (
            <Button onClick={this.onClear}
              className="clearButton pt-minimal pt-small"
              title="Clear this filter" icon="disable" />
          )}
          {(isFetchingValues || isExpandingValues) && (
            <Spinner className="pt-small spinner" />
          )}
        </div>
        <Collapse isOpen={isOpen}>
          {values !== undefined && (
            <CheckboxList items={values}
                          selectedItems={current}
                          onItemClick={this.onSelect}>
              {!isFetchingValues && hasMoreValues && (
                <Button onClick={this.showMore} className="showMoreButton pt-minimal">
                  <FormattedMessage id="search.facets.showMore" defaultMessage="show more {fieldLabel}…" values={{ fieldLabel }}/>
                </Button>
              )}
            </CheckboxList>
          )}
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, { query, field }) => ({
  ...selectFacet(state, { query, field }),
});

SearchFilterFacet = injectIntl(SearchFilterFacet);
SearchFilterFacet = connect(mapStateToProps, { fetchFacet, fetchNextFacetValues })(SearchFilterFacet);
export default SearchFilterFacet;
