import React from 'react';
import { Spinner } from '@blueprintjs/core';

const SearchFilterText = ({ currentValue, onChange, isFetching }) => (
  <div className="search-input pt-input-group pt-large">
    <span className="pt-icon pt-icon-search"/>
    <input className="pt-input" type="search"
      onChange={evt => onChange(evt.target.value)} value={currentValue} />
    {isFetching && <Spinner className="pt-small" />}
  </div>
);

export default SearchFilterText;
