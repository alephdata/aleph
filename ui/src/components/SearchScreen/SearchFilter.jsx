import React, { Component } from 'react';
import { connect } from 'react-redux';
import { size, xor } from 'lodash';

import SearchFilterFacet from './SearchFilterFacet';
import SearchFilterSchema from './SearchFilterSchema';
import SearchFilterText from './SearchFilterText';

import './SearchFilter.css';

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    this.onSingleFilterChange = this.onSingleFilterChange.bind(this);
    this.onMultiFilterChange = this.onMultiFilterChange.bind(this);
  }

  // componentDidUpdate(prevProps, { query }) {
  //   if (query.q !== this.state.query.q) {
  //     this.setState({
  //       queryCountries: null
  //     });
  //   }
  // }

  onSingleFilterChange(filter, value) {
    // const query = {
    //   ...this.state.query,
    //   [filter]: value
    // }

    // this.setState({query});
    let { query } = this.props;
    this.props.updateQuery(query);
  }

  onMultiFilterChange(filter, value) {
    // const query = {
    //   ...this.state.query,
    //   [filter]: xor(this.state.query[filter], [value])
    // }

    // this.setState({query});
    let { query } = this.props;
    this.props.updateQuery(query);
  }

  render() {
    const { result, query, updateQuery } = this.props;
    // const { query } = this.state;

    // Standardised props passed to filters
    const filterProps = onChange => filter => {
      return {
        onChange: onChange.bind(null, filter),
        currentValue: query[filter]
      };
    };

    const singleFilterProps = filterProps(this.onSingleFilterChange);
    const multiFilterProps = filterProps(this.onMultiFilterChange);

    // Generate list of active filters we want to display
    // const activeFilterTagsFn = (filter, labels) =>
    //   query[filter]
    //     .map(id => ({ id, filter, label: labels[id] }))
    //     .sort((a, b) => a.label < b.label ? -1 : 1)

    // const activeFilterTags = [
    //   ...activeFilterTagsFn('filter:countries', countries),
    // ];

    return (
      <div className="search-filter">
        <div className="search-query">
          <div className="search-query__text">
            <SearchFilterText query={query} updateQuery={updateQuery} />
          </div>
          <div className="pt-large">
            <SearchFilterFacet query={query} updateQuery={updateQuery} />
          </div>
        </div>
      </div>
    );
    //<SearchFilterSchema schemas={result.facets.schema.values} {...singleFilterProps('post_filter:schema')} />
  }
}

export default SearchFilter;
