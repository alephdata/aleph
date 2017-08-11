import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab2, Tabs2 } from '@blueprintjs/core';

const ALL_ENTITIES = 'AllEntities';

const SearchFilterEntities = ({ onChange, result, value }) => {
  const _onChange = entityId => onChange(entityId === ALL_ENTITIES ? null : entityId);

  return (
    <Tabs2 id="entityTypes" className="pt-large pt-dark" onChange={_onChange}
      selectedTabId={value}>
      <Tab2 id={ALL_ENTITIES}>
        <FormattedMessage id="search.entities.all" defaultMessage="All Results"/>
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

export default SearchFilterEntities;
