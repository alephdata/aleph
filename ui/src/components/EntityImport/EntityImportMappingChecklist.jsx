/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { fetchCollectionMappings } from 'src/actions';
import { Button, Card, FormGroup, Icon, MenuItem } from '@blueprintjs/core';
import { Select, MultiSelect } from '@blueprintjs/select';
import {
  Schema,
} from 'src/components/common';
import Property from 'src/components/Property';

import './EntityImportMappingChecklist.scss';

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

export class EntityImportMappingChecklist extends Component {
  // renderProperty(property, propMappings) {
  //   const { columnLabels } = this.props;
  //   const propName = property.name;
  //   let value;
  //   if (propMappings.get(propName) !== undefined) {
  //     value = columnLabels[propMappings.get(propName)]
  //   }
  //
  //   return (
  //     <tr className="MappingChecklist__property" key={property.name}>
  //       <td className="MappingChecklist__property__label">{property.label}</td>
  //       <td className="MappingChecklist__property__value">{value}</td>
  //     </tr>
  //   );
  // }

  renderKeySelect({id, keys}) {
    const { columnLabels, onKeyAssign, onKeyRemove } = this.props;

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

  renderEntitySelect(mapping, property) {
    const { mappings, onPropertyAssign } = this.props;
    const { id, schema } = mapping;

    const items = Array.from(mappings.values())
      .filter(({schema}) => !schema.isEdge && schema.isA(property.getRange()))
      .map(({schema}) => schema.name)

    const disabled = items.length < 1;
    const currValue = mapping.properties[property.name];

    return (
      <div className="MappingChecklist__property">
        <span className="MappingChecklist__property__label">{property.label}</span>
        <span className="MappingChecklist__property__value">
          <FormGroup
            label=""
            labelFor="entity-select"
            helperText={disabled ? 'No entities available' : ''}
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
      </div>

    )
  }

  // getMappingsForSchema(schemaName) {
  //   const { columnMappings } = this.props;
  //   const foundMappings = new Map();
  //
  //   columnMappings.forEach((mapping, i) => {
  //     if (mapping) {
  //       const {schema, property} = mapping
  //       if (schema === schemaName) {
  //         foundMappings.set(property.name, i);
  //       }
  //     }
  //   })
  //
  //   return foundMappings;
  // }

  renderMappingChecklist(mapping) {
    const {id, schema} = mapping;
    // const
    // const propMappings = this.getMappingsForSchema(schema.name);

    return (
      <Card className="MappingChecklist__list" key={id}>
        <Schema.Smart.Label schema={schema} icon />
        {schema.description &&
          <span>{schema.description}</span>
        }
        <div className="MappingChecklist__property">
          <span className="MappingChecklist__property__label">Keys</span>
          <span className="MappingChecklist__property__value">
            {this.renderKeySelect(mapping)}
          </span>
        </div>
        {schema.isEdge && (
          <React.Fragment>
            {this.renderEntitySelect(mapping, schema.getProperty(schema.edge.source))}
            {this.renderEntitySelect(mapping, schema.getProperty(schema.edge.target))}
          </React.Fragment>
        )}
      </Card>
    );
    // {visibleProps.map(property => this.renderProperty(property, propMappings))}

  }

  render() {
    const { mappings } = this.props;

    const thingChecklists = [], relationshipChecklists = [];

    mappings.forEach((mapping) => {
      if (mapping.schema.isEdge) {
        relationshipChecklists.push(this.renderMappingChecklist(mapping));
      } else {
        thingChecklists.push(this.renderMappingChecklist(mapping));
      }
    });

    return (
      <div className="MappingChecklist">
        <div className="MappingChecklist__list-container">
          {thingChecklists}
        </div>
        <div className="MappingChecklist__list-container">
          {relationshipChecklists}
        </div>
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
)(EntityImportMappingChecklist);
