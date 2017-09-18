import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab2, Tabs2 } from '@blueprintjs/core';

const SearchFilterSchema = ({ onChange, result, value }) => {
  const schemas = result.facets.schema.values.sort((a, b) => a.label < b.label ? -1 : 1);

  return (
    <Tabs2 id="schemaTypes" className="pt-large pt-dark" onChange={onChange}
      selectedTabId={value}>
      <Tab2 id={null}>
        <FormattedMessage id="search.schema.all" defaultMessage="All Results"/>
        {' '}(<FormattedNumber value={schemas.reduce((total, schema) => total + schema.count, 0)} />)
      </Tab2>
      {schemas.map(schema => (
        <Tab2 id={schema.id} key={schema.id}>
          {schema.label} (<FormattedNumber value={schema.count} />)
        </Tab2>
      ))}
    </Tabs2>
  );
}

export default SearchFilterSchema;
