import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab2, Tabs2 } from '@blueprintjs/core';

const SearchFilterEntities = ({ onChange, result, value }) => (
  <Tabs2 id="entityTypes" className="pt-large pt-dark" onChange={onChange} selectedId={value}>
    <Tab2 id="All">
      <FormattedMessage id="search.entities.All" defaultMessage="All Results"/>
      {' '}(<FormattedNumber value={result.total} />)
    </Tab2>
    {result.facets.schema.values.map(schema => (
      <Tab2 id={schema.id} key={schema.id}>
        {schema.label} (<FormattedNumber value={schema.count} />)
      </Tab2>
    ))}
  </Tabs2>
);

export default SearchFilterEntities;
