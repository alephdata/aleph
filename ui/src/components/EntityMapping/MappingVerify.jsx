import React, { Component } from 'react';
import { compose } from 'redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Card, HTMLTable, InputGroup, MenuItem, Tooltip } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import {
  Schema,
} from 'src/components/common';

import './MappingVerify.scss';

const messages = defineMessages({
  literal_placeholder: {
    id: 'mapping.propAssign.literalPlaceholder',
    defaultMessage: 'Add fixed value text',
  },
  literal_button_text: {
    id: 'mapping.propAssign.literalButtonText',
    defaultMessage: 'Add a fixed value',
  },
  remove: {
    id: 'mapping.propRemove',
    defaultMessage: 'Remove this property from mapping',
  },
});

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
    const { intl, mapping, onPropertyAdd } = this.props;
    const { id, schema, properties } = mapping;

    const items = schema.getEditableProperties()
      .filter(prop => !properties[prop.name] && !prop.type.isEntity)
      .sort((a, b) => (a.label > b.label ? 1 : -1));

    return (
      <Select
        id="entity-select"
        items={items}
        itemRenderer={itemRenderer}
        onItemSelect={(item) => onPropertyAdd(id, item.name, { literal: '' })}
        filterable={false}
        popoverProps={{ minimal: true }}
      >
        <Button
          text={intl.formatMessage(messages.literal_button_text)}
          icon="add"
        />
      </Select>
    );
  }

  renderLiteralEdit(propertyName, value) {
    const { intl, mapping, onPropertyAdd } = this.props;

    return (
      <InputGroup
        id="text-input"
        placeholder={intl.formatMessage(messages.literal_placeholder)}
        onChange={e => onPropertyAdd(mapping.id, propertyName, { literal: e.target.value })}
        value={value}
        small
      />
    );
  }

  renderPropertyValue(propName, propValue) {
    const { fullMappingsList } = this.props;

    if (!propValue) {
      return null;
    }
    if (propValue.column !== undefined) {
      return <td className="MappingVerify__listItem__value bp3-monospace-text">{propValue.column}</td>;
    }
    if (propValue.literal !== undefined) {
      return <td className="MappingVerify__listItem__value">{this.renderLiteralEdit(propName, propValue.literal)}</td>;
    }
    const referredEntity = fullMappingsList.get(propValue);
    if (referredEntity) {
      return (
        <td className="MappingVerify__listItem__value" style={{ color: referredEntity.color, fontWeight: 'bold' }}>
          <Schema.Smart.Label schema={referredEntity.schema} icon />
        </td>
      );
    }

    return null;
  }

  render() {
    const { intl, mapping, onPropertyRemove } = this.props;
    const { id, schema, color, keys, properties } = mapping;

    return (
      <Card className="MappingVerify__item" key={id} style={{ borderColor: color }}>
        <h6 className="MappingVerify__title bp3-heading" style={{ color }}>
          <Schema.Smart.Label schema={schema} icon />
        </h6>
        <div className="MappingVerify__section">
          <span className="MappingVerify__section__title">
            <FormattedMessage id="mapping.keys" defaultMessage="Keys" />
            :
          </span>
          <p className="MappingVerify__section__value bp3-monospace-text">{keys.join(', ')}</p>
        </div>
        <div className="MappingVerify__section">
          <span className="MappingVerify__section__title">
            <FormattedMessage id="mapping.props" defaultMessage="Properties" />
            :
          </span>
          <HTMLTable className="MappingVerify__list">
            <tbody>
              {Array.from(Object.entries(properties)).map(([propName, propValue]) => (
                <tr className="MappingVerify__listItem" key={propName}>
                  <td className="MappingVerify__listItem__label">
                    {schema.getProperty(propName).label}
                  </td>
                  {this.renderPropertyValue(propName, propValue)}
                  <td className="MappingVerify__listItem__close">
                    <Tooltip content={intl.formatMessage(messages.remove)}>
                      <Button minimal icon="cross" onClick={() => onPropertyRemove(id, propName)} />
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>

        </div>
        {this.renderLiteralSelect()}
      </Card>
    );
  }
}

const MappingVerify = ({ items, ...props }) => (
  <div className="MappingVerify">
    {items.map((mapping) => (
      <MappingVerifyItem
        key={mapping.id}
        mapping={mapping}
        {...props}
      />
    ))}
  </div>
);


export default compose(
  injectIntl,
)(MappingVerify);
