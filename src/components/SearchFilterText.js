import React from 'react';

const SearchFilterText = ({ currentValue, onChange }) => (
  <div className="pt-input-group pt-large">
    <span className="pt-icon pt-icon-search"/>
    <input className="search-input pt-input" type="search"
      onChange={evt => onChange(evt.target.value)} value={currentValue} />
  </div>
);

export default SearchFilterText;
