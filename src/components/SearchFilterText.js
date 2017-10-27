import React from 'react';
import { Spinner } from '@blueprintjs/core';

const SearchFilterText = ({ currentValue, onChange, showSpinner }) => (
  <div className="search-input pt-input-group pt-large">
    <span className="pt-icon pt-icon-search"/>
    <input className="pt-input" type="search"
      onChange={evt => onChange(evt.target.value)} value={currentValue} />
    {showSpinner && <Spinner className="pt-small" />}
  </div>
);

export default SearchFilterText;
