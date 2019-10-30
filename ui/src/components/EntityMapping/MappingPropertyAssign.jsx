import React, { Component } from 'react';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';
import { Button, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Schema } from 'src/components/common';
import {
  Cell, Column, ColumnHeaderCell, Table, TruncatedFormat,
} from '@blueprintjs/table';

import './MappingPropertyAssign.scss';

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

  getSchemaProps = (schema) => {
    let featuredProps = schema.getFeaturedProperties();
    let otherProps = schema.getEditableProperties()
      .filter(prop => featuredProps.indexOf(prop) === -1);

    if (schema.isEdge) {
      const edgeProps = schema.edge;
      const edgeCondition = prop => (
        prop.name !== edgeProps.source && prop.name !== edgeProps.target
      );
      featuredProps = featuredProps.filter(edgeCondition);
      otherProps = otherProps.filter(edgeCondition);
    }

    return { featuredProps, otherProps };
  }

  getColumnAssignments() {
    const { mappings } = this.props;
    const columnAssignments = new Map();

    mappings.forEach(({ id, schema, properties }) => {
      Array.from(Object.entries(properties)).forEach(([propKey, propValue]) => {
        if (propValue && propValue.column) {
          columnAssignments.set(propValue.column, {
            mappingId: id, property: schema.getProperty(propKey),
          });
        }
      });
    });

    return columnAssignments;
  }

  itemListRenderer({ items, itemsParentRef, renderItem }) {
    return (
      <Menu ulRef={itemsParentRef}>
        {items.map(({ schema }) => {
          const { featuredProps, otherProps } = this.getSchemaProps(schema);

          return (
            <MenuItem key={schema.name} text={<Schema.Smart.Label schema={schema} icon />}>
              {
                featuredProps.map(prop => renderItem({ schema: schema.name, property: prop }))
              }
              {featuredProps.length && otherProps.length && <MenuDivider />}
              <MenuItem text="Other">
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

  renderHeaderCell(colLabel, colValue) {
    const { onPropertyAssign, mappings } = this.props;

    const style = {
      color: colValue ? 'white' : 'black',
      backgroundColor: colValue ? mappings.get(colValue.mappingId).color : 'unset',
    };

    return (
      <ColumnHeaderCell
        name={colLabel}
        style={style}
      >
        <div className="MappingPropertyAssign__headerSelect">
          {colValue && (
            <div className="MappingPropertyAssign__headerSelect__label">
              <Schema.Smart.Label schema={colValue.mappingId} icon />
            </div>
          )}
          <Select
            id="entity-type"
            items={Array.from(mappings.values())}
            itemListRenderer={listProps => this.itemListRenderer(listProps)}
            itemRenderer={itemRenderer}
            popoverProps={{ minimal: true }}
            filterable={false}
            onItemSelect={({ schema, property }) => (
              onPropertyAssign(schema, property.name, { column: colLabel })
            )}
          >
            <Button
              text={colValue ? `${colValue.property.label}` : 'Assign a value'}
              rightIcon="double-caret-vertical"
              className="MappingPropertyAssign__headerSelect__button"
            />
          </Select>
        </div>
      </ColumnHeaderCell>
    );
  }

  renderCell(rowIndex, colIndex, colHeaderValue) {
    const { csvData, mappings } = this.props;
    const value = csvData[rowIndex][colIndex];
    const loading = false;

    const style = {
      color: colHeaderValue ? 'white' : 'black',
      backgroundColor: colHeaderValue ? mappings.get(colHeaderValue.mappingId).color : 'white',
    };

    return (
      <Cell loading={loading} style={style}>
        <TruncatedFormat detectTruncation>
          {value || ''}
        </TruncatedFormat>
      </Cell>
    );
  }

  render() {
    const { columnLabels } = this.props;
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

            return (
              <Column
                key={colLabel}
                id={i}
                name={colLabel}
                cellRenderer={(rowIndex, colIndex) => this.renderCell(rowIndex, colIndex, colValue)}
                columnHeaderCellRenderer={() => this.renderHeaderCell(colLabel, colValue)}
              />
            );
          })}
        </Table>
      </div>
    );
  }
}

export default compose(injectIntl)(MappingPropertyAssign);
