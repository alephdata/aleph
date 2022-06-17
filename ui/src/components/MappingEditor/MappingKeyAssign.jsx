// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { compose } from 'redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Card, Collapse, FormGroup, Icon, MenuItem } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { MultiSelect } from '@blueprintjs/select';
import SelectWrapper from 'components/common/SelectWrapper';
import { Schema } from 'components/common';
import { MappingLabel } from 'components/MappingEditor/MappingLabel';

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
  moreToggleText: {
    id: 'mapping.keyAssign.additionalHelpToggle.more',
    defaultMessage: 'More about keys',
  },
  lessToggleText: {
    id: 'mapping.keyAssign.additionalHelpToggle.less',
    defaultMessage: 'Less',
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
    key={item.id}
    text={<MappingLabel mapping={item} />}
    onClick={handleClick}
  />
);


export class MappingKeyAssignItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      keyExplanationVisible: false,
    };

    this.toggleKeyExplanation = this.toggleKeyExplanation.bind(this);
  }

  toggleKeyExplanation() {
    this.setState(({ keyExplanationVisible }) => (
      { keyExplanationVisible: !keyExplanationVisible }
    ));
  }

  renderKeySelect({ id, keys }) {
    const { columnLabels, fullMappingsList, onKeyAdd, onKeyRemove, intl } = this.props;
    const { keyExplanationVisible } = this.state;

    const allKeys = fullMappingsList.getMappingKeys(id);
    const items = columnLabels
      .filter((column) => column !== '' && allKeys.indexOf(column) === -1)
      .sort();

    return (
      <FormGroup
        helperText={(
          <div className="MappingKeyAssign__item__keyHelp">
            <div className="MappingKeyAssign__item__keyHelp__main">
              <FormattedMessage
                id="mapping.keyAssign.helpText"
                defaultMessage="Specify which columns from the source data will be used to identify unique entities."
              />
            </div>
            <Collapse isOpen={keyExplanationVisible} className="MappingKeyAssign__item__keyHelp__additional">
              <FormattedMessage
                id="mapping.keyAssign.additionalHelpText"
                defaultMessage={
                  `The best keys are columns from your data that contain id numbers, phone numbers, email addresses,
                  or other uniquely identifying information. If no columns with unique values exist, select multiple columns to allow
                  Aleph to generate unique entities correctly from your data.`
                }
              />
            </Collapse>
            <Button
              small
              minimal
              text={
                keyExplanationVisible
                  ? intl.formatMessage(messages.lessToggleText)
                  : intl.formatMessage(messages.moreToggleText)
              }
              className="bp3-form-helper-text MappingKeyAssign__item__keyHelp__toggle"
              rightIcon={keyExplanationVisible ? 'caret-up' : 'caret-down'}
              onClick={this.toggleKeyExplanation}
            />
          </div>
        )}
      >
        <MultiSelect
          id="key-select"
          items={items}
          itemRenderer={keySelectItemRenderer}
          tagRenderer={item => item}
          onItemSelect={item => onKeyAdd(id, item)}
          selectedItems={allKeys}
          itemPredicate={(query, item) => item.toLowerCase().includes(query.toLowerCase())}
          placeholder={intl.formatMessage(messages.keyAssignPlaceholder)}
          fill
          resetOnSelect
          tagInputProps={{
            tagProps: (key) => ({
              minimal: true,
              onRemove: keys.indexOf(key) > -1 && (() => onKeyRemove(id, key))
            })
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

    const items = fullMappingsList.getValues()
      .filter(({ schema }) => !schema.isEdge && schema.isA(propertyRange))
      .sort((a, b) => a.id.localeCompare(b.id));

    const disabled = items.length < 1;
    const currValue = mapping.properties[property.name];
    const referredEntity = currValue?.entity && fullMappingsList.getMapping(currValue.entity);
    const buttonText = referredEntity
      ? referredEntity.id
      : intl.formatMessage(messages.entityAssignPlaceholder);

    return (
      <div className="MappingKeyAssign__item__property">
        <span className="MappingKeyAssign__item__property__label">{property.label}</span>
        <span className="MappingKeyAssign__item__property__value">
          <FormGroup
            label=""
            labelFor="entity-select"
            helperText={disabled ? intl.formatMessage(messages.entityAssignNoResults) : ''}
          >
            <SelectWrapper
              id="entity-select"
              items={items}
              itemRenderer={entityItemRenderer}
              onItemSelect={entity => onPropertyAdd(id, property.name, { entity: entity.id, required: true })}
              filterable={false}
              popoverProps={{ minimal: true }}
              activeItem={currValue}
            >
              <Button
                text={buttonText}
                rightIcon="caret-down"
                disabled={disabled}
                icon={referredEntity && <Schema.Icon schema={referredEntity.schema} />}
              />
            </SelectWrapper>
          </FormGroup>
        </span>
        {disabled && (
          <span className="MappingKeyAssign__item__property__help">
            <Tooltip
              content={intl.formatMessage(messages.entityAssignHelpText, {
                range: propertyRange.label,
                property: property.label,
              })}
            >
              <Icon icon="help" />
            </Tooltip>
          </span>
        )}
      </div>

    );
  }

  render() {
    const { mapping, onMappingRemove, onMappingIdChange } = this.props;
    const { id, color, schema } = mapping;

    const edgeProps = schema.isEdge ? [schema.edge.source, schema.edge.target] : [];
    const requiredEntityProps = schema.required.filter(prop => (
      schema.getProperty(prop)?.type?.isEntity && edgeProps.indexOf(prop) < 0
    ));

    return (
      <Card className="MappingKeyAssign__item" key={id} style={{ backgroundColor: color }}>
        <Button
          className="MappingKeyAssign__item__close"
          icon="cross"
          minimal
          onClick={() => onMappingRemove(id)}
        />
        <h6 className="MappingKeyAssign__item__title bp3-heading">
          <MappingLabel mapping={mapping} onEdit={onMappingIdChange} />
        </h6>
        <div className="MappingKeyAssign__item__property">
          <span className="MappingKeyAssign__item__property__label">
            <FormattedMessage id="mapping.keys" defaultMessage="Keys" />
          </span>
          <span className="MappingKeyAssign__item__property__value">
            {this.renderKeySelect(mapping)}
          </span>
        </div>
        {[...edgeProps, ...requiredEntityProps].map(prop => (
          this.renderEntitySelect(mapping, schema.getProperty(prop))
        ))}
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
