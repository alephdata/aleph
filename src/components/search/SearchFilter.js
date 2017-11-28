import React, { Component } from 'react';
import { connect } from 'react-redux';
import { mapValues, size, xor } from 'lodash';

import { endpoint } from 'api';
import filters from 'filters';

import SearchFilterCountries from './SearchFilterCountries';
import SearchFilterCollections from './SearchFilterCollections';
import SearchFilterSchema from './SearchFilterSchema';
import SearchFilterText from './SearchFilterText';

import './SearchFilter.css';

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      query: props.query,
      queryCountries: null,
      queryCollectionIds: null
    };

    this.onSingleFilterChange = this.onSingleFilterChange.bind(this);
    this.onMultiFilterChange = this.onMultiFilterChange.bind(this);

    this.onCountriesOpen = this.onCountriesOpen.bind(this);
    this.onCollectionsOpen = this.onCollectionsOpen.bind(this);
  }

  componentDidUpdate(prevProps, { query }) {
    if (query.q !== this.state.query.q) {
      this.setState({
        queryCountries: null,
        queryCollectionIds: null
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

  onCountriesOpen() {
    if (this.state.queryCountries === null) {
      endpoint.get('search', {params: {
        q: this.state.query.q,
        facet: 'countries',
        facet_size: this.props.countriesCount,
        limit: 0
      }}).then(({ data }) => this.setState({
        queryCountries: data.facets.countries.values
      }));
    }
  }

  onCollectionsOpen() {
    if (this.state.queryCollectionIds === null) {
      endpoint.get('search', {params: {
        q: this.props.queryText,
        facet: 'collection_id',
        facet_size: this.props.collectionsCount,
        limit: 0
      }}).then(({ data }) => this.setState({
        queryCollectionIds: data.facets.collection_id.values.map(collection => collection.id)
      }));
    }
  }

  render() {
    const { result, collections, countries, browsingContext } = this.props;
    const { query, queryCountries, queryCollectionIds } = this.state;

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

    // Hide the implicit collection filter when browsing that one collection.
    const activeCollectionFilterTags =
      activeFilterTagsFn(filters.COLLECTIONS, collections)
        .filter(tag => tag.id !== browsingContext.collectionId);

    const activeFilterTags = [
      ...activeFilterTagsFn(filters.COUNTRIES, countries),
      ...activeCollectionFilterTags,
    ];

    return (
      <div className="search-filter">
        <div className="search-query">
          <div className="search-query__text">
            <SearchFilterText {...singleFilterProps('q')} showSpinner={result.isFetching} />
          </div>
          <div className="pt-large">
            <SearchFilterCountries onOpen={this.onCountriesOpen} countries={queryCountries}
              {...multiFilterProps(filters.COUNTRIES)} />
          </div>
          {browsingContext.collectionId === undefined && (
            <div className="pt-large">
              <SearchFilterCollections onOpen={this.onCollectionsOpen} collectionIds={queryCollectionIds}
                {...multiFilterProps(filters.COLLECTIONS)} />
            </div>
          )}
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
            {...singleFilterProps(filters.SCHEMA)} /> }
      </div>
    );
  }
}

const mapStateToProps = ({ metadata, collections }) => ({
  countries: metadata.countries,
  countriesCount: size(metadata.countries),
  collections: mapValues(collections.results, 'label'),
  collectionsCount: size(collections.results)
});

SearchFilter = connect(mapStateToProps)(SearchFilter);

export default SearchFilter;
