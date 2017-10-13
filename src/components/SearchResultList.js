import React from 'react';
import { NonIdealState } from '@blueprintjs/core';

import SearchResultListItem from './SearchResultListItem';

import './SearchResultList.css';

const SearchResultList = ({ result }) => (
  <div>
    { !result.isFetching && result.results.length === 0 &&
      <NonIdealState visual="search" title="No search results"
      description="Try making your search more general" />}
    <table className="results pt-table pt-striped">
      <tbody>
        {result.results.map(item => <SearchResultListItem key={item.id} result={item} />)}
      </tbody>
    </table>
  </div>
);

export default SearchResultList;
