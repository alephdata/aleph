/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { fetchCollectionMappings } from 'src/actions';
import { Button, FormGroup, Callout, Card, H5, Intent, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import {
  Schema,
} from 'src/components/common';

import './EntityImportSchemaSelect.scss';


const itemRenderer = (item, { handleClick }) => (
  <li
    key={item.name}
    className="bp3-menu-item"
    onClick={handleClick}
  >
    <Schema.Smart.Label schema={item} icon />
  </li>
);

export class EntityImportSchemaSelect extends Component {
  render() {
    const { model, onSelect, mappings } = this.props;

    const [things, relationships] = Object.keys(model.schemata)
      .map(key => model.schemata[key])
      .filter(item => item.isCreateable && !item.abstract && !mappings.has(item.name))
      .reduce((result, element) => {
        result[element.schemata.indexOf('Thing') >= 0 ? 0 : 1].push(element);
        return result;
      },[[], []]);

    return (
      <div className="SchemaSelect">
        <Callout className="SchemaSelect__item">
          <H5>
            <FormattedMessage
              id="collection.mapping.selectType"
              defaultMessage="Add an entity"
            />
          </H5>
          <Select
            id="entity-type"
            items={things.sort((a, b) => a.label.localeCompare(b.label))}
            filterable={false}
            itemRenderer={itemRenderer}
            onItemSelect={item => onSelect(item)}
            popoverProps={{ minimal: true }}
          >
            <Button
              text={'Select an entity type to add'}
              rightIcon="double-caret-vertical"
            />
          </Select>
        </Callout>
        <Callout className="SchemaSelect__item">
          <H5>
            <FormattedMessage
              id="collection.mapping.selectType"
              defaultMessage="Add a relationship"
            />
          </H5>
          <Select
            id="entity-type"
            items={relationships.sort((a, b) => a.label.localeCompare(b.label))}
            filterable={false}
            itemRenderer={itemRenderer}
            onItemSelect={item => onSelect(item)}
            popoverProps={{ minimal: true }}
          >
            <Button
              text={'Select an relationship type to add'}
              rightIcon="double-caret-vertical"
            />
          </Select>
        </Callout>
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
)(EntityImportSchemaSelect);
