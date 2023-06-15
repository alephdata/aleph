import { FC, useState } from 'react';
import { Schema, Entity, Property } from '@alephdata/followthemoney';
import { EditableProperty } from 'react-ftm';
import { PropertySelect } from 'react-ftm/editors';
import { FetchEntitySuggestions } from './types';

type Props = {
  entity: Entity;
  fetchEntitySuggestions: FetchEntitySuggestions;
  writeable?: boolean;
  onChange: (entity: Entity) => void;
};

// This component uses the `EditableProperty` component from react-ftm
// which requires a slightly different function signature. This function
// returns an adapted function with the required signature.
function adaptFetchEntitySuggestions(
  fetchEntitySuggestions: FetchEntitySuggestions
) {
  return async (query: string, schemata?: Array<Schema>) => {
    if (schemata === undefined || schemata.length < 1) {
      return [];
    }

    return await fetchEntitySuggestions(schemata[0], query);
  };
}

const EntityViewerProperties: FC<Props> = ({
  entity,
  fetchEntitySuggestions,
  writeable,
  onChange,
}) => {
  const { schema } = entity;

  const [active, setActive] = useState<string | null>(null);
  const [added, setAdded] = useState<Array<string>>([]);

  const onPropertyAdd = (property: Property) =>
    setAdded([...added, property.name]);

  const temporal = [
    ...schema.getTemporalStartProperties(),
    ...schema.getTemporalEndProperties(),
  ].map(({ name }) => name);
  const featured = schema.featured.filter((name) => !temporal.includes(name));
  const nonEmpty = entity.getProperties().map(({ name }) => name);

  const all = new Set(schema.getEditableProperties().map(({ name }) => name));
  const visible = new Set([...featured, ...temporal, ...nonEmpty, ...added]);
  const hidden = new Set(Array.from(all).filter((name) => !visible.has(name)));

  const visibleProps = Array.from(visible).map((name) =>
    schema.getProperty(name)
  );

  const hiddenProps = Array.from(hidden).map((name) =>
    schema.getProperty(name)
  );

  return (
    <div className="EntityViewerProperties theme-light">
      {visibleProps.map((prop) => (
        <EditableProperty
          key={prop.qname}
          writeable={writeable || false}
          entity={entity}
          property={prop}
          editing={active === prop.name}
          fetchEntitySuggestions={adaptFetchEntitySuggestions(
            fetchEntitySuggestions
          )}
          onToggleEdit={() => setActive(prop.name)}
          onSubmit={(entity) => {
            onChange(entity);
            setActive(null);
          }}
        />
      ))}
      {writeable && (
        <PropertySelect properties={hiddenProps} onSelected={onPropertyAdd} />
      )}
    </div>
  );
};

export default EntityViewerProperties;
