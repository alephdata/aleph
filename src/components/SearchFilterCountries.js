import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

class SearchFilterCountries extends Component {
  constructor() {
    super();

    this.onPopoverOpen = this.onPopoverOpen.bind(this);
  }

  onPopoverOpen(evt) {
    if (!this.props.countries) {
      this.props.loadCountries();
    }
  }

  toggleCountryId(countryId) {
    const { value } = this.props;

    const newValue = value.indexOf(countryId) > -1 ?
      value.filter(i => i !== countryId) : [...value, countryId];

    this.props.onChange(newValue);
  }

  render() {
    const { countries, value } = this.props;

    return (
      <Popover position={Position.BOTTOM} popoverWillOpen={this.onPopoverOpen} inline={true}>
        <Button rightIconName="caret-down">
          <FormattedMessage id="search.collections" defaultMessage="Countries"/>
          {countries > 0 && <span> (<FormattedNumber value={countries.length} />)</span>}
        </Button>
        <div className="search-filter-countries">
          {countries ?
            <ul className="search-filter-countries-list">
              {countries.map(country => (
                <li onClick={() => this.toggleCountryId(country.id)} key={country.id}>
                  <span className="pt-icon-standard pt-icon-tick"
                    style={{'visibility': value.indexOf(country.id) > -1 ? 'visible': 'hidden'}} />
                  {country.label}
                </li>
              ))}
            </ul> :
            <Spinner className="pt-large" />}
        </div>
      </Popover>
    );
  }
}

export default SearchFilterCountries;
