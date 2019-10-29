/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { fetchCollectionMappings } from 'src/actions';
import { Button, Card, FormGroup, Icon, InputGroup, MenuItem, Tooltip, Position } from '@blueprintjs/core';
import { Select, MultiSelect } from '@blueprintjs/select';
import {
  Schema,
} from 'src/components/common';
import Property from 'src/components/Property';

import './MappingVerify.scss';

const itemRenderer = (item, { handleClick }) => (
  <MenuItem
    style={{ maxWidth: '30vw' }}
    key={item.name}
    text={item.label}
    onClick={handleClick}
  />
);

class MappingVerifyItem extends Component {
  renderLiteralSelect() {
    const { mapping, onPropertyAssign } = this.props;
    const { id, schema, properties } = mapping;

    const items = schema.getEditableProperties()
      .filter(prop => !properties.hasOwnProperty(prop.name));

    return (
      <Select
        id="entity-select"
        items={items}
        itemRenderer={itemRenderer}
        onItemSelect={(item) => onPropertyAssign(id, item.name, { 'literal': '' })}
        filterable={false}
        popoverProps={{ minimal: true }}
      >
        <Button
          text="Add a literal property"
          icon="add"
        />
      </Select>
    );
  }

  renderLiteralEdit(propertyName, value) {
    const { mapping, onPropertyAssign } = this.props;

    return (
      <InputGroup
        id="text-input"
        placeholder="Add a literal value"
        onChange={e => onPropertyAssign(mapping.id, propertyName, { 'literal': e.target.value })}
        value={value}
        small
      />
    );
  }

  renderPropertyValue(propName, propValue) {
    const { mapping, fullMappingsList } = this.props;

    if (!propValue) {
      return null;
    } else if (propValue.hasOwnProperty('column')) {
      return <span className="MappingVerify__listItem__value" style={{ color: mapping.color }}>{propValue.column}</span>
    } else if (propValue.hasOwnProperty('literal')) {
      return <span className="MappingVerify__listItem__value">{this.renderLiteralEdit(propName, propValue.literal)}</span>
    } else {
      const referredEntity = fullMappingsList.get(propValue);
      return (
        <span className="MappingVerify__listItem__value" style={{ color: referredEntity.color, fontWeight: 'bold' }}>
          <Schema.Smart.Label schema={referredEntity.schema} icon />
        </span>
      );
    }
  }

  render() {
    const { id, schema, color, keys, properties } = this.props.mapping;

    return (
      <Card className="MappingVerify__item" key={id} style={{ borderColor: color }}>
        <h6 className="MappingVerify__title bp3-heading" style={{ color: color }}>
          <Schema.Smart.Label schema={schema} icon />
        </h6>
        <div className="MappingVerify__section">
          <span className="MappingVerify__section__title">Keys:</span>
          <span className="MappingVerify__section__value" style={{ color: color }}>{keys.join(', ')}</span>
        </div>
        <div className="MappingVerify__section">
          <span className="MappingVerify__section__title">Properties:</span>
          <ul className="MappingVerify__list">
            <React.Fragment>
              {Array.from(Object.entries(properties)).map(([propName, propValue]) => (
                <li className="MappingVerify__listItem">
                  <span className="MappingVerify__listItem__label">{schema.getProperty(propName).label}:</span>
                  {this.renderPropertyValue(propName, propValue)}
                </li>
              ))}
            </React.Fragment>
          </ul>

        </div>
        <div className="MappingVerify__section">
          {this.renderLiteralSelect()}
        </div>
      </Card>
    );
  }
}

export class MappingVerify extends Component {
  render() {
    const { items, fullMappingsList, onPropertyAssign } = this.props;

    console.log(items);

    return (
      <div className="MappingVerify">
        {items.map((mapping) => (
          <MappingVerifyItem fullMappingsList={fullMappingsList} mapping={mapping} onPropertyAssign={onPropertyAssign} />
        ))}
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
)(MappingVerify);
