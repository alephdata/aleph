import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

import { endpoint } from '../api';

import SearchFilterList from './SearchFilterList';

import './SearchFilterCountries.css';

class SearchFilterCountries extends Component {
  constructor(props) {
    super(props);

    this.state = {
      countries: [],
      hasLoaded: false
    };

    this.onOpen = this.onOpen.bind(this);
  }

  componentDidUpdate({ queryText }) {
    if (queryText !== this.props.queryText) {
      this.setState({hasLoaded: false});
    }
  }

  onOpen() {
    if (!this.state.hasLoaded) {
      endpoint.get('search', {params: {q: this.props.queryText, facet: 'countries'}})
        .then(response => {
          this.setState({
            countries: response.data.facets.countries.values,
            hasLoaded: true
          });
        });
    }
  }

  render() {
    const { currentValue, onChange } = this.props;
    const { countries, hasLoaded } = this.state;

    return (
      <Popover popoverClassName="search-filter-countries" position={Position.BOTTOM}
               popoverWillOpen={this.onOpen} inline>
        <Button rightIconName="caret-down">
          <FormattedMessage id="search.countries" defaultMessage="Countries"/>
        </Button>
        {hasLoaded ?
          <SearchFilterList items={countries} selectedItems={currentValue} onItemClick={onChange} /> :
          <Spinner className="search-filter-loading pt-large" />}
      </Popover>
    );
  }
}

export default SearchFilterCountries;
