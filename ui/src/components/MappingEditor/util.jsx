import React from 'react';
import { Schema } from 'components/common';

export const MappingLabel = ({ mapping }) => {
  if (!mapping || !mapping.schema || !mapping.id) return null;

  return (
    <>
      <Schema.Icon schema={mapping.schema} className="left-icon" />
      {mapping.id}
    </>
  );
};
