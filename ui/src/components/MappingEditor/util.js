import React from 'react';
import { Colors } from '@blueprintjs/core';
import { Schema } from 'src/components/common';

const colorOptions = [
  Colors.BLUE1, Colors.TURQUOISE1, Colors.VIOLET1, Colors.ORANGE1, Colors.GREEN1, Colors.RED1,
];

export function assignMappingColor(mappings) {
  const colorIndex = Array.from(mappings.values())
    .map(mapping => colorOptions.indexOf(mapping.color))
    .sort()
    .reduce((acc, currentValue) => (
      acc === currentValue ? acc + 1 : acc
    ), 0);

  return colorOptions[colorIndex % colorOptions.length];
}

export const mappingItemRenderer = ({ id, schema }) => (
  <>
    <Schema.Icon schema={schema} className="left-icon" />
    {id}
  </>
);
