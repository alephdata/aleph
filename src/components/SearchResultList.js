import React from 'react';

import SearchResultListItem from './SearchResultListItem'

const SearchResultList = ({ result }) => (
  <div>
    { result.isFetching && <div className='spinner'>Loading...</div> }
    <table className="pt-table pt-bordered">
      <tbody>
        {result.results.map(item => <SearchResultListItem key={item.id} result={item} />)}
      </tbody>
    </table>
  </div>
);

export default SearchResultList;
