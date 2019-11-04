import React, { Component } from 'react';
import { compose } from 'redux';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { defineMessages, injectIntl } from 'react-intl';
import { Schema } from 'src/components/common';

import './MappingSchemaSelect.scss';

const messages = defineMessages({
  thing: {
    id: 'mapping.schemaSelect.button.thing',
    defaultMessage: 'Add a new object',
  },
  relationship: {
    id: 'mapping.schemaSelect.button.relationship',
    defaultMessage: 'Add a new relationship',
  },
});

const itemRenderer = (item, { handleClick }) => (
  <MenuItem
    key={item.label}
    text={<Schema.Smart.Label schema={item} icon />}
    onClick={handleClick}
  />
);

export class MappingSchemaSelect extends Component {
  render() {
    const { intl, schemaSelectOptions, onSelect, type } = this.props;
    const items = schemaSelectOptions[type === 'thing' ? 0 : 1];

    return (
      <div className="MappingSchemaSelect">
        <Select
          id="entity-type"
          items={items.sort((a, b) => a.label.localeCompare(b.label))}
          filterable={false}
          itemRenderer={itemRenderer}
          onItemSelect={item => onSelect(item)}
          popoverProps={{ minimal: true, preventOverflow: true }}
        >
          <Button
            icon="plus"
            text={intl.formatMessage(messages[type])}
            rightIcon="double-caret-vertical"
          />
        </Select>
      </div>
    );
  }
}


export default compose(
  injectIntl,
)(MappingSchemaSelect);
