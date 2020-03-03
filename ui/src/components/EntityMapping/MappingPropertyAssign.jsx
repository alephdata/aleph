import React, { Component } from 'react';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Schema } from 'src/components/common';
import {
  Cell, Column, ColumnHeaderCell, Table, TruncatedFormat,
} from '@blueprintjs/table';

import './MappingPropertyAssign.scss';

const messages = defineMessages({
  error_blank: {
    id: 'mapping.propAssign.errorBlank',
    defaultMessage: 'Columns with no header cannot be assigned',
  },
  error_duplicate: {
    id: 'mapping.propAssign.errorDuplicate',
    defaultMessage: 'Columns with duplicate headers cannot be assigned',
  },
  other: {
    id: 'mapping.propAssign.other',
    defaultMessage: 'Other',
  },
  placeholder: {
    id: 'mapping.propAssign.placeholder',
    defaultMessage: 'Assign a property',
  },
});

const itemRenderer = ({ property }, { handleClick }) => (
  <MenuItem
    key={property.label}
    text={property.label}
    onClick={handleClick}
  />
);

export class MappingPropertyAssign extends Component {
  constructor(props) {
    super(props);

    this.renderCell = this.renderCell.bind(this);
    this.renderHeaderCell = this.renderHeaderCell.bind(this);
  }

  getAssignableProps = (schema) => {
    const featuredProps = schema.getFeaturedProperties()
      .filter(prop => !prop.type.isEntity)
      .sort((a, b) => (a.label > b.label ? 1 : -1));
    const otherProps = schema.getEditableProperties()
      .filter(prop => !prop.type.isEntity && featuredProps.indexOf(prop) === -1)
      .sort((a, b) => (a.label > b.label ? 1 : -1));

    return { featuredProps, otherProps };
  }

  getColumnAssignments() {
    const { mappings } = this.props;
    const columnAssignments = new Map();

    mappings.forEach(({ id, schema, properties }) => {
      console.log(properties);
      if (properties) {
        Array.from(Object.entries(properties)).forEach(([propKey, propValue]) => {
          if (propValue && propValue.column) {
            columnAssignments.set(propValue.column, {
              mappingId: id, property: schema.getProperty(propKey),
            });
          }
        });
      }
    });

    return columnAssignments;
  }

  itemListRenderer({ items, itemsParentRef, renderItem }) {
    const { intl } = this.props;
    return (
      <Menu ulRef={itemsParentRef} onWheel={e => e.stopPropagation()}>
        {items.map(({ schema }) => {
          const { featuredProps, otherProps } = this.getAssignableProps(schema);

          return (
            <MenuItem key={schema.name} text={<Schema.Smart.Label schema={schema} icon />}>
              {
                featuredProps.map(prop => renderItem({ schema: schema.name, property: prop }))
              }
              {featuredProps.length > 0 && otherProps.length > 0 && <MenuDivider />}
              <MenuItem text={intl.formatMessage(messages.other)}>
                {
                  otherProps.map(prop => renderItem({ schema: schema.name, property: prop }))
                }
              </MenuItem>
            </MenuItem>
          );
        })}
      </Menu>
    );
  }

  checkColumnValidity(colLabel) {
    const { columnLabels, intl } = this.props;
    const labelOccurrenceCount = columnLabels.filter(label => label === colLabel).length;

    if (colLabel === '') {
      return intl.formatMessage(messages.error_blank);
    }
    if (labelOccurrenceCount > 1) {
      return intl.formatMessage(messages.error_duplicate);
    }
    return null;
  }

  renderHeaderCell(colLabel, colValue, style, colError) {
    const { intl, onPropertyAdd, onPropertyRemove, mappings } = this.props;

    return (
      <ColumnHeaderCell
        name={colLabel || '-'}
        style={style}
      >
        {colError && (
          <p className="MappingPropertyAssign__error">{colError}</p>
        )}
        {!colError && (
          <div className="MappingPropertyAssign__headerSelect">
            {colValue && (
              <div className="MappingPropertyAssign__headerSelect__label">
                <Schema.Smart.Label schema={colValue.mappingId} icon />
              </div>
            )}
            <Select
              id="entity-type"
              items={Array.from(mappings.values()).sort((a, b) => (a.id > b.id ? 1 : -1))}
              itemListRenderer={listProps => this.itemListRenderer(listProps)}
              itemRenderer={itemRenderer}
              popoverProps={{ minimal: true }}
              filterable={false}
              onItemSelect={({ schema, property }) => {
                onPropertyAdd(schema, property.name, { column: colLabel });
                if (colValue) {
                  onPropertyRemove(colValue.mappingId, colValue.property.name);
                }
              }}
            >
              <Button
                text={colValue ? `${colValue.property.label}` : intl.formatMessage(messages.placeholder)}
                rightIcon="caret-down"
                className="MappingPropertyAssign__headerSelect__button"
              />
            </Select>
          </div>
        )}
      </ColumnHeaderCell>
    );
  }

  renderCell(rowIndex, colIndex, style) {
    const { csvData } = this.props;
    const value = csvData[rowIndex][colIndex];
    const loading = false;

    return (
      <Cell loading={loading} style={style}>
        <TruncatedFormat detectTruncation>
          {value || ''}
        </TruncatedFormat>
      </Cell>
    );
  }

  render() {
    const { columnLabels, mappings } = this.props;
    const columnAssignments = this.getColumnAssignments();

    return (
      <div className="MappingPropertyAssign TableViewer">
        <Table
          numRows={10}
          enableGhostCells
          enableRowHeader
          enableRowResizing={false}
          enableColumnResizing={false}
          selectionModes="NONE"
          defaultColumnWidth={180}
        >
          {columnLabels.map((colLabel, i) => {
            const colValue = columnAssignments.get(colLabel);
            const colError = this.checkColumnValidity(colLabel);
            const style = {
              color: 'black',
              backgroundColor: 'white',
            };

            if (colError) {
              style.color = 'rgba(0,0,0,.4)';
              style.pointerEvents = 'none';
              style.cursor = 'not-allowed';
            } else if (colValue) {
              style.color = 'white';
              style.backgroundColor = mappings.get(colValue.mappingId).color;
            }

            return (
              <Column
                key={colLabel}
                id={i}
                name={colLabel}
                cellRenderer={(rowIndex, colIndex) => (
                  this.renderCell(rowIndex, colIndex, style, colError)
                )}
                columnHeaderCellRenderer={() => (
                  this.renderHeaderCell(colLabel, colValue, style, colError)
                )}
              />
            );
          })}
        </Table>
      </div>
    );
  }
}

export default compose(injectIntl)(MappingPropertyAssign);
