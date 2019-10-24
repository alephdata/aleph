/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { fetchCollectionMappings } from 'src/actions';
import { Button, Card, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Schema } from 'src/components/common';
import {
  Cell, Column, ColumnHeaderCell, Table, TruncatedFormat,
} from '@blueprintjs/table';

const itemRenderer = ({schema, property}, { handleClick }) => {
  const label = `${property.label}`;
  return (
    <li
      key={label}
      className="bp3-menu-item"
      onClick={handleClick}
    >
      {label}
    </li>
  );
};



export class EntityImportPropertyAssign extends Component {
  constructor(props) {
    super(props);

    this.renderCell = this.renderCell.bind(this);
    this.renderHeaderCell = this.renderHeaderCell.bind(this);
  }

  itemListRenderer({ items, itemsParentRef, renderItem }) {
    return (
      <Menu ulRef={itemsParentRef}>
        {items.map(({schema, visibleProps}) => {
          return (
            <MenuItem key={schema.name} text={<Schema.Smart.Label schema={schema} icon />}>
              {
                schema.getFeaturedProperties().map(prop => renderItem({schema: schema.name, property: prop}))
              }
              <MenuDivider />
              <MenuItem text='Other'>
                {
                  schema.getEditableProperties().map(prop => renderItem({schema: schema.name, property: prop}))
                }
              </MenuItem>
            </MenuItem>
          )
        })}

      </Menu>
    );
  };

  renderHeaderCell(colIndex) {
    const { csvData, columnMappings, onPropertyAssign, selectedSchemata } = this.props;
    const columns = csvData[0];
    const colLabel = columns[colIndex];
    const currValue = columnMappings[colIndex]

    return (
      <ColumnHeaderCell
        name={colLabel}
      >
        <Select
          id="entity-type"
          items={Array.from(selectedSchemata.values())}
          itemListRenderer={this.itemListRenderer}
          itemRenderer={itemRenderer}
          popoverProps={{ minimal: true }}
          filterable={false}
          onItemSelect={(item, e) => onPropertyAssign(item, colIndex)}
        >
          <Button
            text={currValue ? `${currValue.schema}.${currValue.property.name}` : 'Assign a value'}
            rightIcon="double-caret-vertical"
          />
        </Select>
      </ColumnHeaderCell>
    );
  }

  renderCell(rowIndex, colIndex) {
    const { csvData } = this.props;
    const value = csvData[rowIndex][colIndex];
    const loading = false;

    return (
      <Cell loading={loading}>
        <TruncatedFormat detectTruncation>
          {value || ''}
        </TruncatedFormat>
      </Cell>
    );
  }

  render() {
    const { csvData } = this.props;
    const columns = csvData[0];

    return (
      <div className="TableViewer">
        <Table
          numRows={10}
          enableGhostCells
          enableRowHeader
        >
          {columns.map((column, i) => (
            <Column
              key={column}
              id={i}
              name={column}
              cellRenderer={this.renderCell}
              columnHeaderCellRenderer={(colIndex) => this.renderHeaderCell(colIndex)}
            />
          ))}
        </Table>
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
)(EntityImportPropertyAssign);
