import { Entity, Property as FTMProperty } from '@alephdata/followthemoney';
import { Property } from 'react-ftm/types';

export const sortEntities = (
  a: Entity,
  b: Entity,
  prop: FTMProperty,
  direction: string,
  resolveEntityReference: (entityId: string) => Entity | undefined
) => {
  const aRaw = a?.getFirst(prop);
  const bRaw = b?.getFirst(prop);

  if (!aRaw) return 1;
  if (!bRaw) return -1;

  const aVal = Property.getSortValue({
    prop,
    value: aRaw,
    resolveEntityReference,
  });
  const bVal = Property.getSortValue({
    prop,
    value: bRaw,
    resolveEntityReference,
  });

  if (direction === 'asc') {
    return aVal < bVal ? -1 : 1;
  } else {
    return aVal < bVal ? 1 : -1;
  }
};
