/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { fetchCollectionMappings } from 'src/actions';
import { Button, Card, FormGroup, Icon, MenuItem, Tooltip, Position } from '@blueprintjs/core';
import { Select, MultiSelect } from '@blueprintjs/select';
import {
  Schema,
} from 'src/components/common';
import Property from 'src/components/Property';

import './MappingList.scss';

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

export class MappingList extends Component {
  renderProperty(property, propValue) {
    const value = propValue.column || propValue;

    return (
      <div className="MappingList__item__property" key={property.name}>
        <span className="MappingList__item__property__label">{property.label}</span>
        <span className="MappingList__item__property__value">{value}</span>
      </div>
    );
  }

  renderKeySelect({id, keys}) {
    const { columnLabels, onKeyAssign, onKeyRemove } = this.props;

    console.log('columnLabels are', columnLabels);

    return (
      <FormGroup
        label=""
        labelFor="key-select"
        helperText={(
          <span>
            All keys combined specify the id of the entity. The id has
            to be unique.
          </span>
        )}
      >
        <MultiSelect
          id="key-select"
          items={columnLabels.filter((column) => keys.indexOf(column) === -1)}
          itemRenderer={keySelectItemRenderer}
          tagRenderer={item => item}
          onItemSelect={item => onKeyAssign(id, item)}
          selectedItems={keys}
          itemPredicate={() => true}
          placeholder={'Select keys from available columns'}
          fill
          tagInputProps={{
            tagProps: { minimal: true },
            onRemove: item => onKeyRemove(id, item),
          }}
          noResults={
            <MenuItem disabled text="No Results" />
          }
          popoverProps={{ minimal: true, popoverClassName: 'EntityImportModeForm-popover' }}
        />
      </FormGroup>
    )
  }

  renderColumnSelect(schema) {
    const {  } = this.props;

    const items = schema.getEditableProperties();
    const currValue = null;

    return (
      <Select
        id="entity-select"
        items={items}
        itemRenderer={keySelectItemRenderer}
        onItemSelect={item => onPropertyAssign(id, property.name, item)}
        filterable={false}
        popoverProps={{ minimal: true }}
        activeItem={currValue}
      >
        <Button
          text={currValue || 'Select a property'}
          rightIcon="double-caret-vertical"
        />
      </Select>
    )
  }

  renderEntitySelect(mapping, property) {
    const { fullMappingsList, onPropertyAssign } = this.props;
    const { id, schema } = mapping;
    const propertyRange = property.getRange();

    const items = Array.from(fullMappingsList.values())
      .filter(({schema}) => !schema.isEdge && schema.isA(propertyRange))
      .map(({schema}) => schema.name)

    const disabled = items.length < 1;
    const currValue = mapping.properties[property.name];

    return (
      <div className="MappingList__item__property">
        <span className="MappingList__item__property__label">{property.label}</span>
        <span className="MappingList__item__property__value">
          <FormGroup
            label=""
            labelFor="entity-select"
            helperText={disabled ? `No matching entities available` : ''}
          >
            <Select
              id="entity-select"
              items={items}
              itemRenderer={entityItemRenderer}
              onItemSelect={item => onPropertyAssign(id, property.name, item)}
              filterable={false}
              popoverProps={{ minimal: true }}
              activeItem={currValue}
            >
              <Button
                text={currValue || 'Select an entity'}
                rightIcon="double-caret-vertical"
                disabled={disabled}
              />

            </Select>
          </FormGroup>
        </span>
        {disabled && (
          <span className="MappingList__item__property__help">
            <Tooltip
              content={`You must create a thing of type "${propertyRange.label}" to be the ${property.label}`}
              position="auto"
            >
              <Icon icon="help" />
            </Tooltip>
          </span>
        )}
      </div>

    )
  }

  renderMappingListItem(mapping) {
    const { editable, onMappingRemove } = this.props;
    const { id, schema, properties } = mapping;

    const style = {
      backgroundColor: mapping.color,
    }

    return (
      <Card className="MappingList__item" key={id} style={style} >
        <Button
          className="MappingList__item__close"
          icon="cross"
          minimal
          onClick={() => onMappingRemove(schema)}
        />
        <h6 className="MappingList__item__title bp3-heading">
          <Schema.Smart.Label schema={schema} icon />
        </h6>
        <div className="MappingList__item__property">
          <span className="MappingList__item__property__label">Keys</span>
          <span className="MappingList__item__property__value">
            {editable && this.renderKeySelect(mapping)}
            {!editable && mapping.keys.join(', ') }
          </span>
        </div>
        {editable && schema.isEdge && (
          <React.Fragment>
            {this.renderEntitySelect(mapping, schema.getProperty(schema.edge.source))}
            {this.renderEntitySelect(mapping, schema.getProperty(schema.edge.target))}
          </React.Fragment>
        )}
        {!editable && Array.from(Object.entries(properties)).map(([propName, propValue]) => (
          this.renderProperty(schema.getProperty(propName), propValue)
        ))}
      </Card>
    );
    // {visibleProps.map(property => this.renderProperty(property, propMappings))}

  }

  render() {
    const { items } = this.props;

    return (
      <div className="MappingList">
        {items.map(item => this.renderMappingListItem(item))}
      </div>
    );
  }
}

const mapDispatchToProps = { fetchCollectionMappings };

const mapStateToProps = () => {
  return {};
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(MappingList);
