import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { defineMessages, injectIntl } from 'react-intl';
import { selectModel } from 'src/selectors';
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
    text={<Schema.Label schema={item} icon />}
    onClick={handleClick}
  />
);

export class MappingSchemaSelect extends Component {
  applyTypeFilter(schema) {
    const { type } = this.props;
    return type === 'thing' ? schema.isThing() : !schema.isThing();
  }

  render() {
    const { intl, model, onSelect, type } = this.props;

    const schemaSelectOptions = model.getSchemata()
      .filter(schema => !schema.generated && !schema.abstract && this.applyTypeFilter(schema))
      .sort((a, b) => a.label.localeCompare(b.label));

    return (
      <div className="MappingSchemaSelect">
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
            text={intl.formatMessage(messages[type])}
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
  injectIntl,
)(MappingSchemaSelect);
