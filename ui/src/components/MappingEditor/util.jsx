import React from 'react';
import { Schema } from 'src/components/common';

export const mappingItemLabel = ({ id, schema }) => (
  <>
    <Schema.Icon schema={schema} className="left-icon" />
    {id}
  </>
);
