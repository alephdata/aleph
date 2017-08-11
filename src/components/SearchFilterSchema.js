import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab2, Tabs2 } from '@blueprintjs/core';

const ALL_SCHEMAS = 'AllSchemas';

const SearchFilterSchema = ({ onChange, result, value }) => {
  const _onChange = schemaId => onChange(schemaId === ALL_SCHEMAS ? null : schemaId);

  return (
    <Tabs2 id="schemaTypes" className="pt-large pt-dark" onChange={_onChange}
      selectedTabId={value}>
      <Tab2 id={ALL_SCHEMAS}>
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
}

export default SearchFilterSchema;
