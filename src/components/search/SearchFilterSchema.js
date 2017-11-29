import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import c from 'classnames';
import sumBy from 'lodash/sumBy';

import SchemaIcon from '../SchemaIcon';

import './SearchFilterSchema.css';

const SearchFilterSchema = ({ schemas, onChange, currentValue }) => (
  <ul className="search-filter-schema">
    <li className={c({'is-selected': !currentValue})} onClick={onChange.bind(null, null)}>
      <SchemaIcon />
      <span className="search-filter-schema-type">
        <FormattedMessage id="search.schema.all" defaultMessage="All results"/><br />
        <FormattedNumber value={sumBy(schemas, 'count')} />
      </span>
    </li>
    {schemas
      .sort((a, b) => a.label < b.label ? -1 : 1)
      .map(schema => (
        <li className={c({'is-selected': currentValue === schema.id})} onClick={onChange.bind(null, schema.id)} key={schema.id}>
          <SchemaIcon schemaId={schema.id} />
          <span className="search-filter-schema-type">
            {schema.label}<br />
            <FormattedNumber value={schema.count} />
          </span>
        </li>
      ))}
  </ul>
);

export default SearchFilterSchema;
