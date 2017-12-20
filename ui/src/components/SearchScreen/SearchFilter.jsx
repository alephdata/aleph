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

    this.state = {
      query: props.query,
      queryCountries: null,
    };

    this.onSingleFilterChange = this.onSingleFilterChange.bind(this);
    this.onMultiFilterChange = this.onMultiFilterChange.bind(this);
  }

  componentDidUpdate(prevProps, { query }) {
    if (query.q !== this.state.query.q) {
      this.setState({
        queryCountries: null
      });
    }
  }

  onSingleFilterChange(filter, value) {
    const query = {
      ...this.state.query,
      [filter]: value
    }

    this.setState({query});
    this.props.updateQuery(query);
  }

  onMultiFilterChange(filter, value) {
    const query = {
      ...this.state.query,
      [filter]: xor(this.state.query[filter], [value])
    }

    this.setState({query});
    this.props.updateQuery(query);
  }

  render() {
    const { result, countries } = this.props;
    const { query } = this.state;

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
    const activeFilterTagsFn = (filter, labels) =>
      query[filter]
        .map(id => ({ id, filter, label: labels[id] }))
        .sort((a, b) => a.label < b.label ? -1 : 1)

    const activeFilterTags = [
      ...activeFilterTagsFn('filter:countries', countries),
    ];

    return (
      <div className="search-filter">
        <div className="search-query">
          <div className="search-query__text">
            <SearchFilterText {...singleFilterProps('q')} showSpinner={result.isFetching} />
          </div>
          <div className="pt-large">
            <SearchFilterFacet {...multiFilterProps('filter:countries')} />
          </div>
          <div className="pt-large">
            <SearchFilterFacet {...multiFilterProps('filter:countries')} />
          </div>
          {activeFilterTags.length > 0 &&
            <div className="search-query__filters">
              Filtering for
              {activeFilterTags.map((tag, i) => (
                <span key={tag.id}>
                  {i > 0 ? (i < activeFilterTags.length - 1 ? ', ' : ' or ') : ' '}
                  <span className="pt-tag pt-tag-removable" data-filter={tag.filter}>
                    {tag.label}
                    <button className="pt-tag-remove"
                      onClick={this.onMultiFilterChange.bind(null, tag.filter, tag.id)} />
                  </span>
                </span>
              ))}
          </div>}
        </div>
        { result.total > 0 &&
          <SearchFilterSchema schemas={result.facets.schema.values}
            {...singleFilterProps('post_filter:schema')} /> }
      </div>
    );
  }
}

const mapStateToProps = ({ metadata, collections }) => ({
  countries: metadata.countries,
  countriesCount: size(metadata.countries),
});

SearchFilter = connect(mapStateToProps)(SearchFilter);

export default SearchFilter;
