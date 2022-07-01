import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Card, HTMLTable, MenuItem } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { PropertyEditor } from '@alephdata/react-ftm';
import { Property } from 'components/common';

import { selectLocale } from 'selectors';
import { MappingLabel } from 'components/MappingEditor/MappingLabel';
import SelectWrapper from 'components/common/SelectWrapper';

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
  constructor(props) {
    super(props);

    this.state = {
      currEditingLiteral: null,
    };
  }

  openLiteralEdit(id) {
    this.setState({ currEditingLiteral: id });
  }

  renderLiteralSelect() {
    const { intl, mapping, onPropertyAdd } = this.props;
    const { id, schema, properties } = mapping;

    const items = schema
      .getEditableProperties()
      .filter(
        (prop) => !prop.type.isEntity && properties && !properties[prop.name]
      )
      .sort((a, b) => (a.label > b.label ? 1 : -1));

    return (
      <SelectWrapper
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
      </SelectWrapper>
    );
  }

  renderLiteralEdit(propertyName, value) {
    const { fullMappingsList, locale, mapping, onPropertyAdd } = this.props;
    const { id, schema } = mapping;
    const { currEditingLiteral } = this.state;

    if (value && currEditingLiteral !== propertyName) {
      return (
        <div className="MappingVerify__literalEdit">
          <Button
            onClick={() => this.openLiteralEdit(propertyName)}
            minimal
            small
          >
            <Property.Values
              prop={schema.getProperty(propertyName)}
              values={value}
            />
          </Button>
        </div>
      );
    }
    return (
      <div className="MappingVerify__literalEdit">
        <PropertyEditor
          locale={locale}
          entity={fullMappingsList.getMappingAsEntity(id)}
          property={schema.getProperty(propertyName)}
          onSubmit={(entity) => {
            onPropertyAdd(mapping.id, propertyName, {
              literal: entity.getProperty(propertyName),
            });
            if (currEditingLiteral === propertyName) {
              this.setState({ currEditingLiteral: null });
            }
          }}
        />
      </div>
    );
  }

  renderPropertyValue(propName, propValue) {
    const { fullMappingsList } = this.props;

    if (!propValue) {
      return null;
    }
    if (propValue.column !== undefined) {
      return (
        <td className="MappingVerify__listItem__value bp3-monospace-text">
          {propValue.column}
        </td>
      );
    }
    if (propValue.literal !== undefined) {
      return (
        <td className="MappingVerify__listItem__value">
          {this.renderLiteralEdit(propName, propValue.literal)}
        </td>
      );
    }
    if (propValue.entity !== undefined) {
      const referredEntity = fullMappingsList.getMapping(propValue.entity);

      if (referredEntity) {
        return (
          <td
            className="MappingVerify__listItem__value"
            style={{ fontWeight: 'bold' }}
          >
            <MappingLabel mapping={referredEntity} />
          </td>
        );
      }
    }

    return null;
  }

  render() {
    const { intl, mapping, onPropertyRemove, onMappingIdChange } = this.props;
    const { id, schema, color, keys, properties } = mapping;

    return (
      <Card
        className="MappingVerify__item"
        key={id}
        style={{ borderColor: color }}
      >
        <h6 className="MappingVerify__title bp3-heading">
          <MappingLabel mapping={mapping} onEdit={onMappingIdChange} />
        </h6>
        <div className="MappingVerify__section">
          <span className="MappingVerify__section__title">
            <FormattedMessage id="mapping.keys" defaultMessage="Keys" />:
          </span>
          <p className="MappingVerify__section__value bp3-monospace-text">
            {keys.join(', ')}
          </p>
        </div>
        <div className="MappingVerify__section">
          <span className="MappingVerify__section__title">
            <FormattedMessage id="mapping.props" defaultMessage="Properties" />:
          </span>
          <HTMLTable className="MappingVerify__list">
            {properties && (
              <tbody>
                {Array.from(Object.entries(properties)).map(
                  ([propName, propValue]) => (
                    <tr className="MappingVerify__listItem" key={propName}>
                      <td className="MappingVerify__listItem__label">
                        {schema.getProperty(propName).label}
                      </td>
                      {this.renderPropertyValue(propName, propValue)}
                      <td className="MappingVerify__listItem__close">
                        <Tooltip content={intl.formatMessage(messages.remove)}>
                          <Button
                            minimal
                            icon="cross"
                            onClick={() => onPropertyRemove(id, propName)}
                          />
                        </Tooltip>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            )}
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
      <MappingVerifyItem key={mapping.id} mapping={mapping} {...props} />
    ))}
  </div>
);

const mapStateToProps = (state) => ({
  locale: selectLocale(state),
});

export default compose(connect(mapStateToProps), injectIntl)(MappingVerify);
