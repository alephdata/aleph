import React, { Component } from 'react';

import SearchFilterCountries from './SearchFilterCountries';
import SearchFilterCollections from './SearchFilterCollections';
import SearchFilterSchema from './SearchFilterSchema';
import SearchFilterText from './SearchFilterText';

import './SearchFilter.css';

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      query: props.query
    };
  }

  onChange(key, value) {
    const query = {
      ...this.state.query,
      [key]: value
    };

    this.setState({query});
    this.props.updateQuery(query);
  }

  render() {
    const { result } = this.props;
    const { query } = this.state;

    const filterProps = key => {
      return {
        onChange: this.onChange.bind(this, key),
        currentValue: query[key],
        queryText: query.q
      };
    };

    return (
      <div className="search-filter">
        <div className="search-query">
          <SearchFilterText {...filterProps('q')} />
          <div className="search-query__button pt-large">
            <SearchFilterCountries {...filterProps('filter:countries')} />
          </div>
          <div className="search-query__button pt-large">
            <SearchFilterCollections {...filterProps('filter:collection_id')} />
          </div>
        </div>
        { result.total > 0 &&
          <SearchFilterSchema schemas={result.facets.schema.values}
            {...filterProps('filter:schema')} /> }
      </div>
    );
  }
}

export default SearchFilter;
