import React from 'react';
import { FormattedNumber } from 'react-intl';

import SearchFilterTick from './SearchFilterTick';

import './SearchFilterList.css';

const SearchFilterList = ({ items, selectedItems, onItemClick }) => (
  <ul className="search-filter-list">
    {items
      .sort((a, b) => a.label < b.label ? -1 : 1)
      .map(item => (
        <li className="search-filter-list-item" onClick={onItemClick.bind(null, item.id)} key={item.id}>
          <SearchFilterTick isTicked={selectedItems.indexOf(item.id) > -1} />
          <span>{item.label}</span>
          <span><FormattedNumber value={item.count} /></span>
        </li>
      ))}
  </ul>
);

export default SearchFilterList;
