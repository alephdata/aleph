import React, { Component } from 'react';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import {
  Schema,
} from 'src/components/common';

import './MappingSchemaSelect.scss';

const itemRenderer = (item, { handleClick }) => (
  <MenuItem
    key={item.label}
    text={<Schema.Smart.Label schema={item} icon />}
    onClick={handleClick}
  />
);

export class MappingSchemaSelect extends Component {
  render() {
    const { schemaSelectOptions, onSelect, type } = this.props;
    const items = schemaSelectOptions[type === 'thing' ? 0 : 1];

    return (
      <div className="MappingSchemaSelect">
        <Select
          id="entity-type"
          items={items.sort((a, b) => a.label.localeCompare(b.label))}
          filterable={false}
          itemRenderer={itemRenderer}
          onItemSelect={item => onSelect(item)}
          popoverProps={{ minimal: true }}
        >
          <Button
            icon="add"
            text={`Add a new ${type}`}
            rightIcon="double-caret-vertical"
          />
        </Select>
      </div>
    );
  }
}

export default MappingSchemaSelect;
