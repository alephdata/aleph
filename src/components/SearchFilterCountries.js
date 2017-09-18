import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Popover, Position } from '@blueprintjs/core';
import c from 'classnames';
import isEqual from 'lodash/isEqual';

import { endpoint } from '../api';

class SearchFilterCountries extends Component {
  constructor() {
    super();

    this.state = {countries: [], selectedCountryIds: []};

    this.onPopoverOpen = this.onPopoverOpen.bind(this);
  }

  componentWillReceiveProps({ params }) {
    if (!isEqual(this.props.params, params)) {
      this.setState({countries: []});
    }
  }

  onPopoverOpen(evt) {
    if (this.state.countries.length === 0) {
      endpoint.get('search', {params: {...this.props.params, 'facet': 'countries'}})
        .then(response => {
          this.setState({countries: response.data.facets.countries.values});
        });
    }
  }

  toggleCountryId(countryId) {
    this.setState({
      selectedCountryIds: {
        ...this.state.selectedCountryIds,
        [countryId]: !this.state.selectedCountryIds[countryId]
      }
    });

    this.props.onChange('blah');
  }

  render() {
    const { countries, selectedCountryIds } = this.state;

    return (
      <Popover position={Position.BOTTOM} popoverWillOpen={this.onPopoverOpen} inline={true}>
        <Button rightIconName="caret-down">
          <FormattedMessage id="search.collections" defaultMessage="Countries"/>
          {countries.length > 0 &&
            <span> (<FormattedNumber value={countries.length} />)</span>}
        </Button>
        <div className="search-filter-countries">
          {countries.length > 0 ?
            <ul className="search-filter-countries-list">
              {countries.map(country => (
                <li onClick={() => this.toggleCountryId(country.id)}
                  className={c({'is-active': selectedCountryIds[country.id]})} key={country.id}>
                  {country.label}
                </li>
              ))}
            </ul> :
            <div className="spinner" />}
        </div>
      </Popover>
    );
  }
}

export default SearchFilterCountries;
