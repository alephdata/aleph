import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

import SearchFilterList from './SearchFilterList';

import './SearchFilterCountries.css';

const SearchFilterCountries = ({ currentValue, onChange, countries, onOpen }) => (
  <Popover popoverClassName="search-filter-countries" position={Position.BOTTOM}
           popoverWillOpen={onOpen} inline>
    <Button rightIconName="caret-down">
      <FormattedMessage id="search.countries" defaultMessage="Countries"/>
    </Button>
    {countries !== null ?
      <SearchFilterList items={countries} selectedItems={currentValue} onItemClick={onChange} /> :
      <Spinner className="search-filter-loading pt-large" />}
  </Popover>
);

export default SearchFilterCountries;
