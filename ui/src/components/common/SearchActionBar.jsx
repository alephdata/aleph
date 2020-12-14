import React from 'react';
import { ControlGroup } from '@blueprintjs/core';

import { ResultText } from 'components/common';

import './SearchActionBar.scss';


const SearchActionBar = ({ children, intl, result }) => {
  return (
    <ControlGroup className="SearchActionBar" fill>
      <div className="SearchActionBar__main text-muted">
        <ResultText result={result} />
      </div>
      {children}
    </ControlGroup>
  );
}

export default SearchActionBar;
