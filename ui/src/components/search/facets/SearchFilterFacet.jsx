import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import messages from 'src/content/messages';
import { fetchSearchResults } from 'src/actions';
import CheckboxList from './CheckboxList';

import './SearchFilterFacet.css';

class SearchFilterFacet extends Component {
  defaultLimit = 10;
  limitIncreaseStep = 10;

  constructor(props)  {
    super(props);

    this.state = {
      total: null,
      values: null,
      limit: this.defaultLimit,
      fetchingTotal: false,
      fetchingValues: false,
      isOpen: props.initiallyOpen !== undefined ? props.initiallyOpen : this.isActive(),
    };

    this.onClick = this.onClick.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.isActive = this.isActive.bind(this);
    this.showMore = this.showMore.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { field, query } = this.props;
    const needsUpdate = (
      nextProps.field !== field ||
      // If the query changed, our known values are outdated; except if the only
      // change was in our facet field, so we omit this field in the comparison.
      !nextProps.query.clearFilter(field)
        .sameAs(query.clearFilter(field))
    );

    if (needsUpdate) {
      // Invalidate previously fetched values.
      this.setState({
        total: null,
        values: null,
        limit: this.defaultLimit,
        fetchingTotal: false,
        fetchingValues: false,
      });
    }

    // // If we just became active, open up for clarity.
    // if (this.isActive(nextProps) && !this.isActive(this.props)) {
    //   this.setState({ isOpen: true });
    // }
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { isOpen, total, values, limit, fetchingTotal, fetchingValues } = this.state;
    const fetchTotal = total === null && !fetchingTotal;
    const fetchValues = isOpen && !fetchingValues && (
      values === null
      // If the limit has increased, we may have to fetch again.
      || (values.length < limit && total !== null && values.length < total)
    );
    if (fetchValues || fetchTotal) {
      this.fetchData({ fetchTotal, fetchValues, limit });
    }
  }

  isActive(props = this.props) {
    return props.query.getFilter(props.field).length > 0;
  }

  async fetchData({ fetchTotal, fetchValues, limit }) {
    const { field, query, fetchSearchResults } = this.props;
    const facetQuery = query
      .limit(0) // The limit of the results, not the facets.
      .clearFacets()
      .addFacet(field)
      .set('facet_total', fetchTotal)
      .set('facet_values', fetchValues)
      .set('facet_size', limit);
    if (fetchTotal) {
      this.setState({ fetchingTotal: true });
    }
    if (fetchValues) {
      this.setState({ fetchingValues: true });
    }
    const { result } = await fetchSearchResults({ query: facetQuery });
    const { total, values } = result.facets[field];
    if (fetchTotal) {
      this.setState({ total, fetchingTotal: false });
    }
    if (fetchValues) {
      this.setState({ values, fetchingValues: false });
    }
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

  render() {
    const { query, field, intl } = this.props;
    const { total, values, limit, isOpen, fetchingValues } = this.state;

    const current = query.getFilter(field);
    const isActive = this.isActive();
    const fieldLabel = messages.search.filter[field]
      ? intl.formatMessage(messages.search.filter[field])
      : field;

    return (
      <div className="SearchFilterFacet">
        <div className={c('opener', { clickable: !!total, active: isActive })} onClick={this.onClick}>
          <Icon icon={`caret-right`} className={c('caret', {rotate: isOpen})} />
          {total !== null
            ? isActive
              ? <FormattedMessage id="search.facets.filteringBy" defaultMessage="Filtering by {count} of {total} {fieldLabel}" values={{ fieldLabel, count: current.length, total }} />
              : <FormattedMessage id="search.facets.filterBy" defaultMessage="Found {total} {fieldLabel}" values={{ fieldLabel, total }} />
            : (
              <span className="">
                <FormattedMessage id="search.facets.countingTotal" defaultMessage="Counting {fieldLabel}…" values={{fieldLabel}} />
              </span>
            )
          }
        </div>
        <Collapse isOpen={isOpen}>
          {values !== null && (
            <CheckboxList items={values}
                          selectedItems={current}
                          onItemClick={this.onSelect}>
              {!fetchingValues && limit < total && (
                <Button onClick={this.showMore} className="showMoreButton pt-minimal">
                  <FormattedMessage id="search.facets.showMore" defaultMessage="show more {fieldLabel}…" values={{ fieldLabel }}/>
                </Button>
              )}
              {fetchingValues && (
                <Spinner className="pt-large" />
              )}
            </CheckboxList>
          )}
        </Collapse>
      </div>
    );
  }
}

SearchFilterFacet = injectIntl(SearchFilterFacet);
SearchFilterFacet = connect(null, { fetchSearchResults })(SearchFilterFacet);
export default SearchFilterFacet;
