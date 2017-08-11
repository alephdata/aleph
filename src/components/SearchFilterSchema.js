import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab2, Tabs2 } from '@blueprintjs/core';

const SearchFilterSchema = ({ onChange, result, value }) => (
  <Tabs2 id="schemaTypes" className="pt-large pt-dark" onChange={onChange}
    selectedTabId={value}>
    <Tab2 id={null}>
      <FormattedMessage id="search.schema.all" defaultMessage="All Results"/>
      {' '}(<FormattedNumber value={result.total} />)
    </Tab2>
    {result.facets.schema.values.map(schema => (
      <Tab2 id={schema.id} key={schema.id}>
        {schema.label} (<FormattedNumber value={schema.count} />)
      </Tab2>
    ))}
  </Tabs2>
);

export default SearchFilterSchema;
