import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab2, Tabs2 } from '@blueprintjs/core';

import SchemaIcon from './SchemaIcon';

const SearchFilterSchema = ({ onChange, schemas, currentValue }) => (
  <Tabs2 id="schemaTypes" className="search-filter-schema pt-large pt-dark" onChange={onChange}
    selectedTabId={currentValue}>
    <Tab2 id={null}>
      <FormattedMessage id="search.schema.all" defaultMessage="All Results"/>
      {' '}(<FormattedNumber value={schemas.reduce((total, schema) => total + schema.count, 0)} />)
    </Tab2>
    {schemas
      .sort((a, b) => a.label < b.label ? -1 : 1)
      .map(schema => (
        <Tab2 id={schema.id} key={schema.id}>
          <SchemaIcon schemaId={schema.id} />
          {schema.label} (<FormattedNumber value={schema.count} />)
        </Tab2>
      ))}
  </Tabs2>
);

export default SearchFilterSchema;
