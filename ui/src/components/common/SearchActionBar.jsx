import React from 'react';
import { ControlGroup } from '@blueprintjs/core';

import { ResultText } from 'components/common';

import './SearchActionBar.scss';


const SearchActionBar = ({ children, customResultText, intl, result }) => {
  return (
    <ControlGroup className="SearchActionBar" fill>
      <div className="SearchActionBar__main">
        <ResultText result={result} customText={customResultText} />
      </div>
      {children}
    </ControlGroup>
  );
}

export default SearchActionBar;
