/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { fetchCollectionMappings } from 'src/actions';
import { Button, FormGroup, Card, H5, Intent, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import {
  Schema,
} from 'src/components/common';

import './MappingSelect.scss';

const itemRenderer = (item, { handleClick }) => (
  <li
    key={item.name}
    className="bp3-menu-item"
    onClick={handleClick}
  >
    <Schema.Smart.Label schema={item} icon />
  </li>
);

export class MappingSelect extends Component {
  render() {
    const { schemaSelectOptions, onSelect, type } = this.props;
    const items = schemaSelectOptions[type === 'thing' ? 0 : 1];

    return (
      <div className="MappingSelect">
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

export default MappingSelect;
