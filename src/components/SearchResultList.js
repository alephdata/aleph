import React from 'react';

import SearchResultListItem from './SearchResultListItem';

import './SearchResultList.css';

const SearchResultList = ({ result }) => (
  <div>
    { result.isFetching && <div className='spinner'>Loading...</div> }
    <table className="results pt-table pt-striped">
      <tbody>
        {result.results.map(item => <SearchResultListItem key={item.id} result={item} />)}
      </tbody>
    </table>
  </div>
);

export default SearchResultList;
