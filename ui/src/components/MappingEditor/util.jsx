import React from 'react';
import { Schema } from 'src/components/common';

export const MappingLabel = (mapping) => {
  if (!mapping || !mapping.schema || !mapping.id) return null;

  return (
    <>
      <Schema.Icon schema={mapping.schema} className="left-icon" />
      {mapping.id}
    </>
  );
};
