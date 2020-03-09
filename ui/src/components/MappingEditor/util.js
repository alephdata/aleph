import React from 'react';
import { Schema } from 'src/components/common';

export const mappingItemRenderer = ({ id, schema }) => (
  <>
    <Schema.Icon schema={schema} className="left-icon" />
    {id}
  </>
);
