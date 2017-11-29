import React from 'react';
import c from 'classnames';

const SearchFilterTick = ({ isTicked }) => (
  <span className={c('pt-icon-standard', 'search-tick', {'is-ticked': isTicked})} />
);

export default SearchFilterTick;
