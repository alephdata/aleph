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
        {items.map(({schema}) => {
          let featuredProps = schema.getFeaturedProperties();
          let otherProps = schema.getEditableProperties()
            .filter(prop => featuredProps.indexOf(prop) === -1);

          if (schema.isEdge) {
            const edgeProps = schema.edge;
            const edgeCondition = prop => prop.name !== edgeProps.source && prop.name !== edgeProps.target
            featuredProps = featuredProps.filter(edgeCondition)
            otherProps = otherProps.filter(edgeCondition)
          }

          if (featuredProps.length > 0) {
            return (
              <MenuItem key={schema.name} text={<Schema.Smart.Label schema={schema} icon />}>
                {
                  featuredProps.map(prop => renderItem({schema: schema.name, property: prop}))
                }
                <MenuDivider />
                <MenuItem text='Other'>
                  {
                    otherProps.map(prop => renderItem({schema: schema.name, property: prop}))
                  }
                </MenuItem>
              </MenuItem>
            )
          } else {
            return (
              <MenuItem key={schema.name} text={<Schema.Smart.Label schema={schema} icon />}>
                {
                  otherProps.map(prop => renderItem({schema: schema.name, property: prop}))
                }
              </MenuItem>
            )
          }

        })}

      </Menu>
    );
  };

  getColumnAssignments() {
    const { mappings } = this.props;

    const columnAssignments = new Map();

    mappings.forEach(({ id, schema, properties }) => {
      Array.from(Object.entries(properties)).forEach(([propKey, propValue]) => {
        if (propValue && propValue.column) {
          columnAssignments.set(propValue.column, { mappingId: id, property: schema.getProperty(propKey)});
        }
      })
    })

    console.log('columnAssignments', columnAssignments);
    return columnAssignments;
  }

  renderHeaderCell(colLabel, colValue) {
    const { onPropertyAssign, mappings } = this.props;

    const style = {
      color:  colValue ? 'white' : 'black',
      backgroundColor: colValue ? mappings.get(colValue.mappingId).color : 'unset',
    };

    console.log('colvalue is', colValue);

    return (
      <ColumnHeaderCell
        name={colLabel}
        style={style}
      >
        <div className="EntityImport__headerSelect">
          {colValue && (
            <div className="EntityImport__headerSelect__label">
              <Schema.Smart.Label schema={colValue.mappingId} icon />
            </div>
          )}
          <Select
            id="entity-type"
            items={Array.from(mappings.values())}
            itemListRenderer={this.itemListRenderer}
            itemRenderer={itemRenderer}
            popoverProps={{ minimal: true }}
            filterable={false}
            onItemSelect={({schema, property}, e) => onPropertyAssign(schema, property.name, {column: colLabel})}
          >
            <Button
              text={colValue ? `${colValue.property.label}` : 'Assign a value'}
              rightIcon="double-caret-vertical"
              className="EntityImport__header-select-button"
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
      color:  colHeaderValue ? 'white' : 'black',
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
    const { csvData, columnLabels, mappings } = this.props;
    const columnAssignments = this.getColumnAssignments();

    return (
      <div className="TableViewer">
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
            )
          })}
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
