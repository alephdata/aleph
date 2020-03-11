import React from 'react';
import { Schema } from 'src/components/common';

export const mappingItemLabel = (mapping) => {
  if (!mapping || !mapping.schema || !mapping.id) return null;

  return (
    <>
      <Schema.Icon schema={mapping.schema} className="left-icon" />
      {mapping.id}
    </>
  );
};
