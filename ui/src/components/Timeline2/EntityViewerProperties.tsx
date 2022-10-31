import { FC, useState } from 'react';
import { Entity, Property } from '@alephdata/followthemoney';
import { EditableProperty } from 'react-ftm';
import { PropertySelect } from 'react-ftm/editors';

type Props = {
  entity: Entity;
  onChange: (entity: Entity) => void;
};

const EntityViewerProperties: FC<Props> = ({ entity, onChange }) => {
  const { schema } = entity;

  const [active, setActive] = useState<string | null>(null);
  const [added, setAdded] = useState<Array<string>>([]);

  const onPropertyAdd = (property: Property) =>
    setAdded([...added, property.name]);

  const featured = schema.getFeaturedProperties().map(({ name }) => name);
  const nonEmpty = entity.getProperties().map(({ name }) => name);

  const all = new Set(schema.getEditableProperties().map(({ name }) => name));
  const visible = new Set([...featured, ...nonEmpty, ...added]);
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
          writeable={true}
          entity={entity}
          property={prop}
          editing={active === prop.name}
          onToggleEdit={() => setActive(prop.name)}
          onSubmit={(entity) => {
            onChange(entity);
            setActive(null);
          }}
        />
      ))}
      <PropertySelect properties={hiddenProps} onSelected={onPropertyAdd} />
    </div>
  );
};

export default EntityViewerProperties;
