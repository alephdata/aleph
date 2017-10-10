import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

import { endpoint } from '../api';

import './SearchFilterCountries.css';

class SearchFilterCountries extends Component {
  constructor(props) {
    super(props);

    this.state = {
      countries: [],
      loaded: false
    };

    this.onOpen = this.onOpen.bind(this);
    this.toggleCountryId = this.toggleCountryId.bind(this);
  }

  componentDidUpdate({ queryText }) {
    if (queryText !== this.props.queryText) {
      this.setState({loaded: false});
    }
  }

  onOpen() {
    if (!this.state.loaded) {
      endpoint.get('search', {params: {q: this.props.queryText, facet: 'countries'}})
        .then(response => {
          this.setState({
            countries: response.data.facets.countries.values,
            loaded: true
          });
        });
    }
  }

  toggleCountryId(countryId) {
    const { currentValue, onChange } = this.props;

    const newValue = currentValue.indexOf(countryId) > -1 ?
      currentValue.filter(i => i !== countryId) : [...currentValue, countryId];

    onChange(newValue);
  }

  render() {
    const { currentValue } = this.props;
    const { countries, loaded } = this.state;

    return (
      <Popover position={Position.BOTTOM} popoverWillOpen={this.onOpen} inline>
        <Button rightIconName="caret-down">
          <FormattedMessage id="search.countries" defaultMessage="Countries"/>
          {loaded && <span> (<FormattedNumber value={countries.length} />)</span>}
        </Button>
        {loaded ?
          <ul className="search-filter-countries">
            {countries
              .sort((a, b) => a.label < b.label ? -1 : 1)
              .map(country => (
                <li onClick={this.toggleCountryId.bind(null, country.id)} key={country.id}>
                  <span className="pt-icon-standard pt-icon-tick"
                    style={{'visibility': currentValue.indexOf(country.id) > -1 ? 'visible': 'hidden'}} />
                  {country.label}
                </li>
              ))}
          </ul> :
          <Spinner className="search-filter-loading pt-large" />}
      </Popover>
    );
  }
}

export default SearchFilterCountries;
