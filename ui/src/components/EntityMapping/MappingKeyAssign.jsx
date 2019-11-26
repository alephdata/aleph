import React, { Component } from 'react';
import { compose } from 'redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Card, FormGroup, Icon, MenuItem, Tooltip } from '@blueprintjs/core';
import { Select, MultiSelect } from '@blueprintjs/select';
import {
  Schema,
} from 'src/components/common';

import './MappingKeyAssign.scss';

const messages = defineMessages({
  keyAssignPlaceholder: {
    id: 'mapping.keyAssign.placeholder',
    defaultMessage: 'Select keys from available columns',
  },
  keyAssignNoResults: {
    id: 'mapping.keyAssign.noResults',
    defaultMessage: 'No results',
  },
  entityAssignNoResults: {
    id: 'mapping.entityAssign.noResults',
    defaultMessage: 'No matching objects available',
  },
  entityAssignPlaceholder: {
    id: 'mapping.entityAssign.placeholder',
    defaultMessage: 'Select an object',
  },
  entityAssignHelpText: {
    id: 'mapping.entityAssign.helpText',
    defaultMessage: 'You must create an object of type "{range}" to be the {property}',
  },
});

const keySelectItemRenderer = (item, { handleClick }) => (
  <MenuItem
    style={{ maxWidth: '30vw' }}
    key={item}
    text={item}
    onClick={handleClick}
  />
);

const entityItemRenderer = (item, { handleClick }) => (
  <MenuItem
    style={{ maxWidth: '30vw' }}
    key={item}
    text={<Schema.Smart.Label schema={item} icon />}
    onClick={handleClick}
  />
);


export class MappingKeyAssignItem extends Component {
  renderKeySelect({ id, keys }) {
    const { columnLabels, onKeyAdd, onKeyRemove, intl } = this.props;

    const items = columnLabels
      .filter((column) => column !== '' && keys.indexOf(column) === -1)
      .sort();

    return (
      <FormGroup
        helperText={(
          <span>
            <FormattedMessage
              id="mapping.keyAssign.helpText"
              defaultMessage="All keys combined specify the id of the entity. The id must be unique."
            />
          </span>
        )}
      >
        <MultiSelect
          id="key-select"
          items={items}
          itemRenderer={keySelectItemRenderer}
          tagRenderer={item => item}
          onItemSelect={item => onKeyAdd(id, item)}
          selectedItems={keys}
          itemPredicate={() => true}
          placeholder={intl.formatMessage(messages.keyAssignPlaceholder)}
          fill
          tagInputProps={{
            tagProps: { minimal: true },
            onRemove: item => onKeyRemove(id, item),
          }}
          noResults={
            <MenuItem disabled text={intl.formatMessage(messages.keyAssignNoResults)} />
          }
          popoverProps={{ minimal: true, popoverClassName: 'EntityMappingModeForm-popover' }}
        />
      </FormGroup>
    );
  }

  renderEntitySelect(mapping, property) {
    const { intl, fullMappingsList, onPropertyAdd } = this.props;
    const { id } = mapping;
    const propertyRange = property.getRange();

    const items = Array.from(fullMappingsList.values())
      .filter(({ schema }) => !schema.isEdge && schema.isA(propertyRange))
      .map(({ schema }) => schema.name)
      .sort((a, b) => a.localeCompare(b));

    const disabled = items.length < 1;
    const currValue = mapping.properties[property.name];

    return (
      <div className="MappingKeyAssign__item__property">
        <span className="MappingKeyAssign__item__property__label">{property.label}</span>
        <span className="MappingKeyAssign__item__property__value">
          <FormGroup
            label=""
            labelFor="entity-select"
            helperText={disabled ? intl.formatMessage(messages.entityAssignNoResults) : ''}
          >
            <Select
              id="entity-select"
              items={items}
              itemRenderer={entityItemRenderer}
              onItemSelect={item => onPropertyAdd(id, property.name, item)}
              filterable={false}
              popoverProps={{ minimal: true }}
              activeItem={currValue}
            >
              <Button
                text={currValue || intl.formatMessage(messages.entityAssignPlaceholder)}
                rightIcon="caret-down"
                disabled={disabled}
              />

            </Select>
          </FormGroup>
        </span>
        {disabled && (
          <span className="MappingKeyAssign__item__property__help">
            <Tooltip
              content={intl.formatMessage(messages.entityAssignHelpText, {
                range: propertyRange.label,
                property: property.label,
              })}
              position="auto"
            >
              <Icon icon="help" />
            </Tooltip>
          </span>
        )}
      </div>

    );
  }

  render() {
    const { mapping, onMappingRemove } = this.props;
    const { id, color, schema } = mapping;

    return (
      <Card className="MappingKeyAssign__item" key={id} style={{ backgroundColor: color }}>
        <Button
          className="MappingKeyAssign__item__close"
          icon="cross"
          minimal
          onClick={() => onMappingRemove(schema)}
        />
        <h6 className="MappingKeyAssign__item__title bp3-heading">
          <Schema.Smart.Label schema={schema} icon />
        </h6>
        <div className="MappingKeyAssign__item__property">
          <span className="MappingKeyAssign__item__property__label">
            <FormattedMessage id="mapping.keys" defaultMessage="Keys" />
          </span>
          <span className="MappingKeyAssign__item__property__value">
            {this.renderKeySelect(mapping)}
          </span>
        </div>
        {schema.isEdge && (
          <>
            {this.renderEntitySelect(mapping, schema.getProperty(schema.edge.source))}
            {this.renderEntitySelect(mapping, schema.getProperty(schema.edge.target))}
          </>
        )}
      </Card>
    );
  }
}

const MappingKeyAssign = ({ items, ...props }) => (
  <div className="MappingKeyAssign">
    {items.map(item => (
      <MappingKeyAssignItem
        key={item.id}
        mapping={item}
        {...props}
      />
    ))}
  </div>
);

export default compose(injectIntl)(MappingKeyAssign);
