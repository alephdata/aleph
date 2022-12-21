import { FC } from 'react';
import { Entity } from '@alephdata/followthemoney';

type TimelineItemCaptionProps = {
  entity: Entity;
};

const getEdgeEndCaption = (
  entity: Entity,
  propertyName: string
): string | null => {
  const values = entity.getProperty(propertyName);

  if (values.length <= 0) {
    return null;
  }

  const property = entity.schema.getProperty(propertyName);

  if (!property.type.isEntity) {
    return values[0] as string;
  }

  return (values[0] as Entity).getCaption();
};

const TimelineItemCaption: FC<TimelineItemCaptionProps> = ({ entity }) => {
  const schema = entity.schema;

  if (!schema.edge) {
    return <>{entity.getCaption()}</>;
  }

  const source = getEdgeEndCaption(entity, schema.edge.source);
  const target = getEdgeEndCaption(entity, schema.edge.target);
  const label = schema.edge.label;

  if (!source || !target) {
    return <>{entity.getCaption()}</>;
  }

  return (
    <>
      {source} {label} {target}
    </>
  );
};

export default TimelineItemCaption;
