import * as React from 'react';
import { MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Model, Schema as FTMSchema } from '@alephdata/followthemoney';
import { Schema } from 'react-ftm/types';

interface ISelectSchemaProps {
  model: Model;
  onSelect: (schema: FTMSchema) => void;
  optionsFilter?: (schema: FTMSchema) => boolean;
}

const TypedSelect = Select.ofType<FTMSchema>();

const itemRenderer = (
  schema: FTMSchema,
  { handleClick }: { handleClick: any }
) => (
  <MenuItem
    key={schema.name}
    text={<Schema.Label schema={schema} icon />}
    onClick={handleClick}
  />
);

class SchemaSelect extends React.PureComponent<ISelectSchemaProps> {
  render() {
    const { model, onSelect, optionsFilter } = this.props;

    const schemaSelectOptions = model
      .getSchemata()
      .filter(
        (schema) =>
          !schema.generated &&
          !schema.abstract &&
          (!optionsFilter || optionsFilter(schema))
      )
      .sort((a, b) => a.label.localeCompare(b.label));

    return (
      <TypedSelect
        items={schemaSelectOptions}
        filterable={false}
        itemRenderer={itemRenderer}
        onItemSelect={onSelect}
        popoverProps={{ minimal: true }}
        className="SchemaSelect"
      >
        {this.props.children}
      </TypedSelect>
    );
  }
}

export default SchemaSelect;
