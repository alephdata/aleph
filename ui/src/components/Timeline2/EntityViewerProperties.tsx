import { FC, useState } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { EditableProperty } from 'react-ftm';

type Props = {
  entity: Entity;
  onChange: (entity: Entity) => void;
};

const EntityViewerProperties: FC<Props> = ({ entity, onChange }) => {
  const { schema } = entity;
  const featured = entity.schema.featured;
  const nonEmpty = entity.getProperties().map((prop) => prop.name);
  const propNames = new Set([...featured, ...nonEmpty]);
  const props = Array.from(propNames).map((name) => schema.getProperty(name));

  const [activeProperty, setActiveProperty] = useState<string | null>(null);

  return (
    <div className="EntityViewerProperties theme-light">
      {props.map((prop) => (
        <EditableProperty
          key={prop.qname}
          writeable={true}
          entity={entity}
          property={prop}
          editing={activeProperty === prop.name}
          onToggleEdit={() => setActiveProperty(prop.name)}
          onSubmit={(entity) => {
            onChange(entity);
            setActiveProperty(null);
          }}
        />
      ))}
    </div>
  );
};

export default EntityViewerProperties;
