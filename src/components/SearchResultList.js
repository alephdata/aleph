import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab2, Tabs2 } from '@blueprintjs/core';

import SearchResultListItem from './SearchResultListItem'

import './SearchResultList.css';

const schemas = [
  {
    'id': 'Document',
    'label': 'Documents'
  },
  {
    'id': 'Person',
    'label': 'People'
  },
  {
    'id': 'Company',
    'label': 'Companies'
  },
  {
    'id': 'LegalEntity',
    'label': 'Legal Entities'
  }
];

const SearchResultList = ({ result, changeEntityFilter }) => (
  <div>
    { result.isFetching && <div className='spinner'>Loading...</div> }
    <div className="entity-types">
      <Tabs2 id="entityTypes" className="pt-large" onChange={changeEntityFilter}
              selectedTabId={result.schemaFilter}>
        <Tab2 id="All">
          <FormattedMessage id="search.entities.All" defaultMessage="All Results"/>
          { !result.isFetching && <span> (<FormattedNumber value={result.total} />)</span> }
        </Tab2>
        {schemas.map(schema => (
          <Tab2 id={schema.id} key={schema.id}>
            <FormattedMessage id={`search.entities.${schema.id}`} defaultMessage={schema.label}/>
            {' '}(0)
          </Tab2>
        ))}
      </Tabs2>
    </div>
    <table className="pt-table pt-bordered">
      <tbody>
        {result.results.filter(item => result.schemaFilter === 'All' || result.schemaFilter === item.schema).map(item => (
          <SearchResultListItem key={item.id} result={item} />
        ))}
      </tbody>
    </table>
  </div>
);

export default SearchResultList;
