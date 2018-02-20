import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import messages from 'src/content/messages';
import { fetchFacet } from 'src/actions';
import { selectFacet } from 'src/selectors';
import CheckboxList from './CheckboxList';

import './SearchFilterFacet.css';

class SearchFilterFacet extends Component {
  defaultLimit = 10;
  limitIncreaseStep = 10;

  constructor(props)  {
    super(props);

    this.state = {
      limit: this.defaultLimit,
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
      || this.state.isOpen !== prevState.isOpen
      || this.state.limit !== prevState.limit) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const { total, values, isFetchingTotal, isFetchingValues, fetchFacet } = this.props;
    const { isOpen, limit } = this.state;
    const fetchTotal = total === undefined && !isFetchingTotal;
    const fetchValues = isOpen && !isFetchingValues && (
      values === undefined
      // If the limit has increased, we may have to fetch again.
      || (values.length < limit && total !== undefined && values.length < total)
    );
    if (fetchTotal || fetchValues) {
      const { query, field } = this.props;
      fetchFacet({ query, field, fetchTotal, fetchValues, limit });
    }
  }

  isActive(props = this.props) {
    return props.query.getFilter(props.field).length > 0;
  }

  showMore() {
    const { limit } = this.state;
    this.setState({ limit: limit + this.limitIncreaseStep });
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
    const { query, field, total, values, isFetchingValues, intl } = this.props;
    const { limit, isOpen } = this.state;

    const current = query.getFilter(field);
    const count = current.length;
    const isActive = this.isActive();
    const fieldLabel = messages.search.filter[field]
      ? intl.formatMessage(messages.search.filter[field])
      : field;

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
          {isFetchingValues && (
            <Spinner className="pt-small spinner" />
          )}
        </div>
        <Collapse isOpen={isOpen}>
          {values !== undefined && (
            <CheckboxList items={values}
                          selectedItems={current}
                          onItemClick={this.onSelect}>
              {!isFetchingValues && limit < total && (
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
SearchFilterFacet = connect(mapStateToProps, { fetchFacet })(SearchFilterFacet);
export default SearchFilterFacet;
