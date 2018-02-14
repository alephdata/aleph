import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import messages from 'src/content/messages';
import { fetchSearchResults } from 'src/actions';
import CheckboxList from './CheckboxList';

import './SearchFilterFacet.css';

class SearchFilterFacet extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      total: null,
      values: null,
      isOpen: props.initiallyOpen !== undefined ? props.initiallyOpen : this.isActive(),
    };

    this.onClick = this.onClick.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.isActive = this.isActive.bind(this);
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
      this.setState({ values: null, total: null });
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
    const { isOpen, values, total } = this.state;
    // TODO check if already fetching?
    const fetchTotal = total === null;
    const fetchValues = values === null && isOpen;
    if (fetchValues || fetchTotal) {
      this.fetchData({ fetchTotal, fetchValues });
    }
  }

  isActive(props = this.props) {
    return props.query.getFilter(props.field).length > 0;
  }

  async fetchData({ fetchTotal, fetchValues }) {
    const { field, query, fetchSearchResults } = this.props;
    const params = query
      .limit(0)
      .clearFacets()
      .addFacet(field)
      .set('facet_total', fetchTotal ? 'true' : 'false')
      .set('facet_values', fetchValues ? 'true' : 'false')
      .set('facet_size', 500)
      .toParams();
    const { result } = await fetchSearchResults({filters: params});
    const { total, values } = result.facets[field];
    if (fetchTotal) {
      this.setState({ total });
    }
    if (fetchValues) {
      this.setState({ values });
    }
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
    const { total, values, isOpen } = this.state;

    const current = query.getFilter(field);
    const isActive = this.isActive();
    const fieldLabel = messages.search.filter[field]
      ? intl.formatMessage(messages.search.filter[field])
      : field;

    return (
      <div className="SearchFilterFacet">
        <div className={c('opener', { clickable: total !== 0, active: isActive })} onClick={this.onClick}>
          <Icon icon={`caret-right`} className={c('caret', {rotate: isOpen})} />
          {isActive
            ? <FormattedMessage id="search.facets.filteringBy" defaultMessage="Filtering by {count} of {total} {fieldLabel}" values={{ fieldLabel, count: current.length, total }} />
            : <FormattedMessage id="search.facets.filterBy" defaultMessage="Found {total} {fieldLabel}" values={{ fieldLabel, total }} />
          }
        </div>
        <Collapse isOpen={isOpen}>
          {values !== null
            ? <CheckboxList items={values}
                            selectedItems={current}
                            onItemClick={this.onSelect} />
            : <Spinner className="pt-large" />
          }
        </Collapse>
      </div>
    );
  }
}

SearchFilterFacet = injectIntl(SearchFilterFacet);
SearchFilterFacet = connect(null, { fetchSearchResults })(SearchFilterFacet);
export default SearchFilterFacet;
