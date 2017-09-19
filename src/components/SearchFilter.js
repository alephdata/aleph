import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';

import { endpoint } from '../api';

import SearchFilterCountries from './SearchFilterCountries';
import SearchFilterSchema from './SearchFilterSchema';

import './SearchFilter.css';

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      query: props.query
    };

    this.onTextChange = this.onTextChange.bind(this);
    this.onCountriesChange = this.onCountriesChange.bind(this);
    this.onSchemaChange = this.onSchemaChange.bind(this);

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
  }

  onCountriesChange(countries) {
    this.handleQueryChange('filter:countries', countries);
  }

  onSchemaChange(type) {
    this.handleQueryChange('filter:schema', type);
  }

  render() {
    const { query, countries } = this.state;
    const { result } = this.props;

    return (
      <div className="search-filter">
        <div className="search-query">
          <div className="search-query__text pt-input-group pt-large">
            <span className="pt-icon pt-icon-search"/>
            <input className="pt-input" type="search" onChange={this.onTextChange}
              value={query.q}/>
          </div>
          <div className="search-query__button pt-large">
            <SearchFilterCountries onChange={this.onCountriesChange} loadCountries={this.loadCountries}
              value={query['filter:countries'] || []} countries={countries} />
          </div>
          <div className="search-query__button pt-large">
            <Button rightIconName="caret-down">
              <FormattedMessage id="search.collections" defaultMessage="Collections"/>
              {' '}(55)
            </Button>
          </div>
        </div>
        { result.total > 0 &&
          <SearchFilterSchema onChange={this.onSchemaChange} result={result}
            value={query['filter:schema']} /> }
      </div>
    );
  }
}

export default SearchFilter;
