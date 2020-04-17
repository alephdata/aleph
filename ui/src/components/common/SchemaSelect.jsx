import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { selectModel } from 'src/selectors';
import { Schema } from 'src/components/common';

import './SchemaSelect.scss';

const itemRenderer = (item, { handleClick }) => (
  <MenuItem
    key={item.label}
    text={<Schema.Label schema={item} icon />}
    onClick={handleClick}
  />
);

export class SchemaSelect extends Component {
  render() {
    const { model, onSelect, optionsFilter, placeholder } = this.props;

    const schemaSelectOptions = model.getSchemata()
      .filter(schema => !schema.generated && !schema.abstract && optionsFilter(schema))
      .sort((a, b) => a.label.localeCompare(b.label));

    return (
      <div className="SchemaSelect">
        <Select
          id="entity-type"
          items={schemaSelectOptions}
          filterable={false}
          itemRenderer={itemRenderer}
          onItemSelect={item => onSelect(item)}
          popoverProps={{ minimal: true, preventOverflow: true }}
        >
          <Button
            icon="plus"
            text={placeholder}
          />
        </Select>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  model: selectModel(state),
});

export default compose(
  connect(mapStateToProps),
)(SchemaSelect);
