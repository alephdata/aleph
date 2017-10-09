import React, { Component } from 'react';

import { endpoint } from '../api';

import SearchFilterCountries from './SearchFilterCountries';
import SearchFilterCollections from './SearchFilterCollections';
import SearchFilterSchema from './SearchFilterSchema';

import './SearchFilter.css';

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      query: props.query,
      countries: [],
      countriesLoaded: false,
      collections: [],
      collectionsLoaded: false
    };

    this.onTextChange = this.onTextChange.bind(this);

    this.onCollectionsOpen = this.onCollectionsOpen.bind(this);
    this.onCountriesOpen = this.onCountriesOpen.bind(this);
  }

  handleQueryChange(key, value) {
    const query = {
      ...this.state.query,
      [key]: value
    };

    this.setState({query});
    this.props.updateQuery(query);
  }

  onTextChange(e) {
    this.handleQueryChange('q', e.target.value);
    this.setState({countriesLoaded: false, collectionsLoaded: false});
  }

  onCountriesOpen() {
    if (!this.state.countriesLoaded) {
      endpoint.get('search', {params: {q: this.state.query.q, facet: 'countries'}})
        .then(response => {
          this.setState({
            countries: response.data.facets.countries.values,
            countriesLoaded: true
          });
        });
    }
  }

  onCollectionsOpen() {
    if (!this.state.collectionsLoaded) {
      endpoint.get('search', {params: {q: this.state.query.q, facet: 'collection_id'}})
        .then(response => {
          this.setState({
            collections: response.data.facets.collection_id.values,
            collectionsLoaded: true
          });
        });
    }
  }

  render() {
    const { query, countries, countriesLoaded, collections, collectionsLoaded } = this.state;
    const { result } = this.props;

    const filterProps = key => {
      return {
        onChange: value => this.handleQueryChange(key, value),
        currentValue: query[key]
      };
    };

    return (
      <div className="search-filter">
        <div className="search-query">
          <div className="search-query__text pt-input-group pt-large">
            <span className="pt-icon pt-icon-search"/>
            <input className="pt-input" type="search" onChange={this.onTextChange} value={query.q} />
          </div>
          <div className="search-query__button pt-large">
            <SearchFilterCountries onOpen={this.onCountriesOpen} countries={countries}
              loaded={countriesLoaded} {...filterProps('filter:countries')} />
          </div>
          <div className="search-query__button pt-large">
            <SearchFilterCollections onOpen={this.onCollectionsOpen} collections={collections}
              loaded={collectionsLoaded} {...filterProps('filter:collection_id')} />
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
