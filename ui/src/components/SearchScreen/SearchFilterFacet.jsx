import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

import { fetchSearchResults } from 'src/actions';
import CheckboxList from './CheckboxList';

import './SearchFilterFacet.css';

class SearchFilterFacet extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      values: null,
      isOpen: false,
    };

    this.onInteraction = this.onInteraction.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { field, query } = this.props;
    const { isOpen } = this.state;
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
      if (isOpen) {
        this.fetchValues();
      }
    }
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

  onInteraction(nextOpenState) {
    this.setState({ isOpen: nextOpenState });

    if (nextOpenState === true && this.state.values === null) {
      this.fetchValues();
    }
  }

  onSelect(value) {
    const { field } = this.props;
    let query = this.props.query;
    query = query.toggleFilter(field, value)
    this.props.updateQuery(query)
  }

  render() {
    const { query, children, field } = this.props;
    const { values, isOpen } = this.state;
    const current = query.getFilter(field);

    return (
      <Popover popoverClassName="SearchFilterFacet"
               position={Position.BOTTOM_RIGHT}
               isOpen={isOpen}
               onInteraction={this.onInteraction}
               inline={true} >
        <Button rightIcon="caret-down">
          {children}
        </Button>
        {values !== null
          ? <CheckboxList items={values}
                          selectedItems={current}
                          onItemClick={this.onSelect} />
          : <Spinner className="pt-large" />
        }
      </Popover>
    );
  }
}

SearchFilterFacet = connect(null, { fetchSearchResults })(SearchFilterFacet);
export default SearchFilterFacet;
