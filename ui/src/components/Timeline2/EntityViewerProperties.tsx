import { FC } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { EditableProperty } from 'react-ftm';

type Props = {
  entity: Entity;
};

const EntityViewerProperties: FC<Props> = ({ entity }) => {
  const { schema } = entity;
  const featured = entity.schema.featured;
  const nonEmpty = entity.getProperties().map((prop) => prop.name);
  const propNames = new Set([...featured, ...nonEmpty]);
  const props = Array.from(propNames).map((name) => schema.getProperty(name));

  return (
    <div className="EntityViewerProperties theme-light">
      {props.map((prop) => (
        <EditableProperty
          key={prop.qname}
          writeable={false}
          entity={entity}
          property={prop}
          editing={false}
          onToggleEdit={() => {}}
          onSubmit={() => {}}
        />
      ))}
    </div>
  );
};

export default EntityViewerProperties;
