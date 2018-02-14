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
      this.setState({ values: null });
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
    const { isOpen, values } = this.state;
    // TODO check if already fetching?
    if (isOpen && values === null) {
      this.fetchValues();
    }
  }

  isActive(props = this.props) {
    return props.query.getFilter(props.field).length > 0;
  }

  async fetchValues() {
    const { field, query, fetchSearchResults } = this.props;
    const params = query
      .limit(0)
      .clearFacets()
      .addFacet(field)
      .set('facet_size', 500)
      .toParams();
    const { result } = await fetchSearchResults({filters: params});
    this.setState({
      values: result.facets[field].values,
    });
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
    const { values, isOpen } = this.state;

    const current = query.getFilter(field);
    const isActive = this.isActive();
    const fieldLabel = messages.search.filter[field]
      ? intl.formatMessage(messages.search.filter[field])
      : field;

    return (
      <div className="SearchFilterFacet">
        <div className="clickable opener" onClick={this.onClick}>
          <Icon icon={`caret-right`} className={c('caret', {rotate: isOpen})} />
          <font color={!isActive ? 'gray' : 'black'}>
            {isActive
              ? <FormattedMessage id="search.facets.filteringBy" defaultMessage="Filtering by {count} {fieldLabel}" values={{fieldLabel, count: current.length}} />
              : <FormattedMessage id="search.facets.filterBy" defaultMessage="Filter by {fieldLabel}" values={{fieldLabel}} />
            }
          </font>
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
