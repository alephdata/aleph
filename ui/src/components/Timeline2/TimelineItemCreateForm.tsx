import { FC, FormEvent, useState, useCallback, useEffect } from 'react';
import { throttle } from 'lodash';
import {
  Model,
  Schema,
  Entity,
  Property,
  Value,
  Values,
} from '@alephdata/followthemoney';
import type { EntityProperties, EdgeSchema, FetchEntitySuggestions } from './types';
import { SchemaSelect, EntitySelect } from 'react-ftm';
import { Button, Alignment, FormGroup, InputGroup } from '@blueprintjs/core';

import './TimelineItemCreateForm.scss';

type SchemaFieldProps = {
  model: Model;
  value: Schema | null;
  onChange: (schema: Schema) => void;
};

type PropertyFieldProps = {
  property: Property;
  value?: string;
  required?: boolean;
  placeholder?: string;
  onChange: (property: Property, value: Value) => void;
};

type EntityPropertyFieldProps = {
  property: Property;
  value?: Entity;
  fetchEntitySuggestions?: FetchEntitySuggestions;
  onChange: (property: Property, value: Value) => void;
};

type EdgeFieldsProps = {
  schema: EdgeSchema;
  properties: EntityProperties;
  fetchEntitySuggestions?: FetchEntitySuggestions;
  onChange: (property: Property, value: Value) => void;
};

type CaptionFieldProps = {
  schema: Schema;
  properties: EntityProperties;
  onChange: (property: Property, value: Value) => void;
};

type TemporalExtentFieldsProps = {
  schema: Schema;
  properties: EntityProperties;
  onChange: (property: Property, value: Value) => void;
};

type TimelineItemCreateFormProps = {
  model: Model;
  onSubmit: (entity: Entity) => void;
  id?: string;
  fetchEntitySuggestions?: FetchEntitySuggestions;
};

const SchemaField: FC<SchemaFieldProps> = ({ model, value, onChange }) => (
  <FormGroup label="Type" labelFor="schema">
    <SchemaSelect
      model={model}
      onSelect={onChange}
      optionsFilter={(schema) => schema.getTemporalStartProperties().length > 0}
    >
      <Button
        id="schema"
        name="schema"
        fill
        rightIcon="caret-down"
        alignText={Alignment.LEFT}
        text={value?.label || 'Select type'}
      />
    </SchemaSelect>
  </FormGroup>
);

const PropertyField: FC<PropertyFieldProps> = ({
  property,
  value,
  required,
  placeholder,
  onChange,
}) => (
  <FormGroup label={property.label} labelFor={property.name}>
    <InputGroup
      name={property.name}
      id={property.name}
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(event) => onChange(property, event.target.value)}
    />
  </FormGroup>
);

const EntityPropertyField: FC<EntityPropertyFieldProps> = ({
  property,
  value,
  fetchEntitySuggestions,
  onChange,
}) => {
  const [suggestions, setSuggestions] = useState<Array<Entity>>([]);
  const [isFetching, setIsFetching] = useState(false);

  const onQueryChange = useCallback(
    throttle(
      async (query: string) => {
        if (!fetchEntitySuggestions) {
          return;
        }

        setIsFetching(true);

        try {
          const entities = await fetchEntitySuggestions(
            property.getRange(),
            query
          );
          setSuggestions(entities);
        } finally {
          setIsFetching(false);
        }
      },
      200,
      { leading: false, trailing: true }
    ),
    [property, fetchEntitySuggestions]
  );

  const onSubmit = (values: Values) => {
    onChange(property, values[0]);
  };

  useEffect(() => {
    onQueryChange('');
  }, []);

  return (
    <FormGroup label={property.label} labelFor={property.name}>
      <EntitySelect
        allowMultiple={false}
        onSubmit={onSubmit}
        values={value ? [value] : []}
        entitySuggestions={suggestions}
        isFetching={isFetching && suggestions.length <= 0}
        onQueryChange={onQueryChange}
        buttonProps={{
          id: property.name,
          name: property.name,
        }}
      />
    </FormGroup>
  );
};

const TemporalExtentFields: FC<TemporalExtentFieldsProps> = ({
  schema,
  properties,
  onChange,
}) => {
  const propNames = new Set([
    ...schema.getTemporalStartProperties().map((prop) => prop.name),
    ...schema.getTemporalEndProperties().map((prop) => prop.name),
  ]);

  if (propNames.has('date') && propNames.has('startDate')) {
    propNames.delete('date');
  }

  const props = Array.from(propNames).map((name) => ({
    property: schema.getProperty(name),
    value: properties[name],
  }));

  return (
    <>
      {props.map(({ property, value }) => (
        <PropertyField
          key={property.name}
          property={property}
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          placeholder="YYYY-MM-DD"
        />
      ))}
    </>
  );
};

const EdgeFields: FC<EdgeFieldsProps> = ({
  schema,
  properties,
  fetchEntitySuggestions,
  onChange,
}) => {
  const source = schema.getProperty(schema.edge.source);
  const target = schema.getProperty(schema.edge.target);
  const sourceValue = properties[source.name];
  const targetValue = properties[target.name];

  return (
    <>
      <EntityPropertyField
        property={source}
        value={sourceValue instanceof Entity ? sourceValue : undefined}
        fetchEntitySuggestions={fetchEntitySuggestions}
        onChange={onChange}
      />
      <EntityPropertyField
        property={target}
        value={targetValue instanceof Entity ? targetValue : undefined}
        fetchEntitySuggestions={fetchEntitySuggestions}
        onChange={onChange}
      />
    </>
  );
};

const CaptionField: FC<CaptionFieldProps> = ({
  schema,
  properties,
  onChange,
}) => {
  const caption = schema.getProperty(schema.caption?.[0]);
  const value = properties[caption.name];

  return (
    <PropertyField
      property={caption}
      value={typeof value === 'string' ? value : ''}
      required
      onChange={onChange}
    />
  );
};

const isEdge = (schema: Schema): schema is EdgeSchema => schema.isEdge;

const TimelineItemCreateForm: FC<TimelineItemCreateFormProps> = ({
  id,
  model,
  onSubmit,
  fetchEntitySuggestions,
}) => {
  const [schemaName, setSchemaName] = useState<string | null>('Event');
  const [properties, setProperties] = useState<EntityProperties>({});
  const schema = (schemaName && model.schemata[schemaName]) || null;

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!schema) {
      return;
    }

    const entity = model.createEntity(schema);

    for (const [property, value] of Object.entries(properties)) {
      entity.setProperty(property, value);
    }

    onSubmit(entity);
  };

  const onSchemaChange = ({ name }: Schema) => {
    setProperties({});
    setSchemaName(name);
  };

  const onPropertyChange = (property: Property, value: Value) => {
    setProperties({ ...properties, [property.name]: value });
  };

  return (
    <form id={id} onSubmit={onFormSubmit}>
      <SchemaField model={model} value={schema} onChange={onSchemaChange} />

      {schema && (
        <>
          <div className="TimelineItemCreateForm__row">
            {isEdge(schema) ? (
              <EdgeFields
                schema={schema}
                properties={properties}
                fetchEntitySuggestions={fetchEntitySuggestions}
                onChange={onPropertyChange}
              />
            ) : (
              <CaptionField
                schema={schema}
                onChange={onPropertyChange}
                properties={properties}
              />
            )}
          </div>
          <div className="TimelineItemCreateForm__row">
            <TemporalExtentFields
              schema={schema}
              properties={properties}
              onChange={onPropertyChange}
            />
          </div>
        </>
      )}
    </form>
  );
};

export default TimelineItemCreateForm;
