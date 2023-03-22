import {
  FC,
  FormEvent,
  useState,
  forwardRef,
  FormEventHandler,
  KeyboardEventHandler,
  ForwardedRef,
} from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Model,
  Schema,
  Entity,
  Property,
  Value,
  Values,
} from '@alephdata/followthemoney';
import type {
  EntityProperties,
  EdgeSchema,
  FetchEntitySuggestions,
} from './types';
import { useEntitySuggestions } from './util';
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
  pattern?: string;
  onChange: (property: Property, value: Value) => void;
};

type EntityPropertyFieldProps = {
  property: Property;
  value?: Entity;
  fetchEntitySuggestions: FetchEntitySuggestions;
  onChange: (property: Property, value: Value) => void;
};

type EdgeFieldsProps = {
  schema: EdgeSchema;
  properties: EntityProperties;
  fetchEntitySuggestions: FetchEntitySuggestions;
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
  onInput: FormEventHandler;
  onKeyDown: KeyboardEventHandler;
  id?: string;
  fetchEntitySuggestions: FetchEntitySuggestions;
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
  pattern,
  onChange,
}) => (
  <FormGroup
    label={property.label}
    labelFor={property.name}
    labelInfo={
      !required && (
        <FormattedMessage
          id="timeline.item_create_form.optional"
          defaultMessage="(optional)"
        />
      )
    }
  >
    <InputGroup
      name={property.name}
      id={property.name}
      value={value}
      required={required}
      placeholder={placeholder}
      pattern={pattern}
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
  const [suggestions, isFetching, onQueryChange] = useEntitySuggestions(
    property.getRange(),
    fetchEntitySuggestions
  );

  const onSubmit = (values: Values) => {
    onChange(property, values[0]);
  };

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
  const startPropNames = new Set(
    schema.getTemporalStartProperties().map((prop) => prop.name)
  );
  const endPropNames = new Set(
    schema.getTemporalEndProperties().map((prop) => prop.name)
  );

  // Showing fields for `date` and `startDate` would be kind of redundant.
  if (startPropNames.has('date') && startPropNames.has('startDate')) {
    startPropNames.delete('date');
  }

  // The `Person` schema inherits incorporation/dissolution properties from `LegalEntity`.
  // There is a pragmatic reason for this inheritance hierarchy. However, When creating a
  // new `Person` entity in a timeline, this would cause fields for incorporation/dissolution
  // dates as well as birth/death dates to be displayed, which is a rather confusing UX.
  if (schema.name === 'Person') {
    startPropNames.delete('incorporationDate');
    endPropNames.delete('dissolutionDate');
  }

  const propNames = new Set([
    ...Array.from(startPropNames),
    ...Array.from(endPropNames),
  ]);

  const props = Array.from(propNames).map((name) => {
    const required = startPropNames.size < 2 && startPropNames.has(name);

    return {
      property: schema.getProperty(name),
      value: properties[name],
      required,
    };
  });

  return (
    <>
      {props.map(({ property, value, required }) => (
        <PropertyField
          key={property.name}
          property={property}
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          placeholder="YYYY-MM-DD"
          pattern="\d{4}(?:-\d{1,2}){0,2}"
          required={required}
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

const TimelineItemCreateForm = (
  props: TimelineItemCreateFormProps,
  formRef: ForwardedRef<HTMLFormElement>
) => {
  const { id, model, onSubmit, onInput, onKeyDown, fetchEntitySuggestions } =
    props;

  const [entity, setEntity] = useState<Entity>(model.createEntity('Event'));

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(entity);
  };

  const onSchemaChange = (schema: Schema) => {
    if (entity.schema.name === schema.name) {
      return;
    }

    const newEntity = model.createEntity(schema);
    newEntity.copyProperties(entity);
    setEntity(newEntity);
  };

  const onPropertyChange = (property: Property, value: Value) => {
    const newEntity = entity.clone();
    newEntity.properties.set(property, [value]);
    setEntity(newEntity);
  };

  // Transform the entity properties into an object with single-value properties
  // as this data structure is slightly easier to work with for our use case.
  const properties = Object.fromEntries(
    entity
      .getProperties()
      .filter((property: Property) => entity.getProperty(property).length > 0)
      .map((property: Property) => [
        property.name,
        entity.getProperty(property)[0],
      ])
  );

  return (
    <form
      id={id}
      onSubmit={onFormSubmit}
      onInput={onInput}
      onKeyDown={onKeyDown}
      ref={formRef}
    >
      <SchemaField
        model={model}
        value={entity.schema}
        onChange={onSchemaChange}
      />
      <div className="TimelineItemCreateForm__row">
        {isEdge(entity.schema) ? (
          <EdgeFields
            schema={entity.schema}
            properties={properties}
            fetchEntitySuggestions={fetchEntitySuggestions}
            onChange={onPropertyChange}
          />
        ) : (
          <CaptionField
            schema={entity.schema}
            onChange={onPropertyChange}
            properties={properties}
          />
        )}
      </div>
      <div className="TimelineItemCreateForm__row">
        <TemporalExtentFields
          schema={entity.schema}
          properties={properties}
          onChange={onPropertyChange}
        />
      </div>
    </form>
  );
};

export default forwardRef<HTMLFormElement, TimelineItemCreateFormProps>(
  TimelineItemCreateForm
);
