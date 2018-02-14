import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, Collapse, Spinner } from '@blueprintjs/core';

import messages from 'src/content/messages';
import { fetchSearchResults } from 'src/actions';
import CheckboxList from './CheckboxList';

import './SearchFilterFacet.css';

class SearchFilterFacet extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      values: null,
      isOpen: this.isActive(),
    };

    this.onInteraction = this.onInteraction.bind(this);
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

  componentWillUpdate(nextProps, nextState) {
    const { isOpen, values } = nextState;
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

  onInteraction() {
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
    const fieldLabel = intl.formatMessage(messages.search.filter[field]);

    return (
      <div className="SearchFilterFacet">
        <Button className="button pt-minimal" rightIcon="caret-down" onClick={this.onInteraction}>
          <font color={!isActive ? 'gray' : 'black'}>
            Filter{isActive && 'ing'} by {fieldLabel}
          </font>
        </Button>
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
