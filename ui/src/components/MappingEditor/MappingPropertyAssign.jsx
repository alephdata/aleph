import React, { Component } from 'react';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import {
  Button,
  Classes,
  Menu,
  MenuDivider,
  MenuItem,
  PopoverInteractionKind,
} from '@blueprintjs/core';
import {
  Cell,
  Column,
  ColumnHeaderCell,
  Table,
  TruncatedFormat,
} from '@blueprintjs/table';
import c from 'classnames';
import { MappingLabel } from 'components/MappingEditor/MappingLabel';
import SelectWrapper from 'components/common/SelectWrapper';

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
  <MenuItem key={property.label} text={property.label} onClick={handleClick} />
);

export class MappingPropertyAssign extends Component {
  constructor(props) {
    super(props);

    this.renderCell = this.renderCell.bind(this);
    this.renderHeaderCell = this.renderHeaderCell.bind(this);
    this.onItemSelect = this.onItemSelect.bind(this);
  }

  onItemSelect({ id, property }, colLabel, colValue) {
    const { onPropertyAdd, onPropertyRemove } = this.props;

    onPropertyAdd(id, property.name, { column: colLabel });
    if (colValue) {
      onPropertyRemove(colValue.id, colValue.property.name);
    }
  }

  getAssignableProps = (schema) => {
    const featuredProps = schema
      .getFeaturedProperties()
      .filter((prop) => !prop.type.isEntity)
      .sort((a, b) => (a.label > b.label ? 1 : -1));
    const otherProps = schema
      .getEditableProperties()
      .filter(
        (prop) => !prop.type.isEntity && featuredProps.indexOf(prop) === -1
      )
      .sort((a, b) => (a.label > b.label ? 1 : -1));

    return { featuredProps, otherProps };
  };

  mappingListRenderer({ items, itemsParentRef, renderItem }) {
    return (
      <Menu ulRef={itemsParentRef} onWheel={(e) => e.stopPropagation()}>
        {items.map((mapping) => (
          <MenuItem
            key={mapping.id}
            text={<MappingLabel mapping={mapping} truncate={15} />}
            popoverProps={{ interactionKind: PopoverInteractionKind.CLICK }}
            className="MappingPropertyAssign__headerSelect__item"
          >
            {this.propertyListRenderer(mapping, renderItem, false)}
          </MenuItem>
        ))}
      </Menu>
    );
  }

  propertyListRenderer(mapping, renderItem, showHeader) {
    const { id, schema } = mapping;
    const { featuredProps, otherProps } = this.getAssignableProps(schema);

    return (
      <>
        {showHeader && (
          <li
            className={c(
              Classes.MENU_HEADER,
              'MappingPropertyAssign__headerSelect__propListHeading'
            )}
          >
            <h6 className={Classes.HEADING}>
              <MappingLabel mapping={mapping} truncate={25} />
            </h6>
          </li>
        )}
        {featuredProps.map((prop) => renderItem({ id, property: prop }))}
        {featuredProps.length > 0 && otherProps.length > 0 && <MenuDivider />}
        {otherProps.map((prop) => renderItem({ id, property: prop }))}
      </>
    );
  }

  checkColumnValidity(colLabel) {
    const { columnLabels, intl } = this.props;
    const labelOccurrenceCount = columnLabels.filter(
      (label) => label === colLabel
    ).length;

    if (colLabel === '') {
      return intl.formatMessage(messages.error_blank);
    }
    if (labelOccurrenceCount > 1) {
      return intl.formatMessage(messages.error_duplicate);
    }
    return null;
  }

  renderHeaderCell(colLabel, colValue, style, colError) {
    const { intl, mappings, onPropertyRemove } = this.props;

    return (
      <ColumnHeaderCell name={colLabel || '-'} style={style}>
        {colError && <p className="MappingPropertyAssign__error">{colError}</p>}
        {!colError && (
          <div className="MappingPropertyAssign__headerSelect">
            {colValue && (
              <>
                <div className="MappingPropertyAssign__headerSelect__label">
                  <MappingLabel mapping={colValue} truncate={15} />
                </div>
                <SelectWrapper
                  id="property-select"
                  items={[]}
                  itemListRenderer={({ itemsParentRef, renderItem }) => (
                    <Menu
                      ulRef={itemsParentRef}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {this.propertyListRenderer(colValue, renderItem, true)}
                    </Menu>
                  )}
                  itemRenderer={itemRenderer}
                  popoverProps={{ minimal: true }}
                  filterable={false}
                  onItemSelect={(item) =>
                    this.onItemSelect(item, colLabel, colValue)
                  }
                >
                  <Button
                    text={colValue.property.label}
                    rightIcon="caret-down"
                    className="MappingPropertyAssign__headerSelect__button"
                  />
                </SelectWrapper>
                <div className="MappingPropertyAssign__headerSelect__remove">
                  <Button
                    icon="cross"
                    minimal
                    small
                    onClick={() =>
                      onPropertyRemove(colValue.id, colValue.property.name)
                    }
                  />
                </div>
              </>
            )}
            {!colValue && (
              <SelectWrapper
                id="mapping-select"
                fill
                items={mappings
                  .getValues()
                  .sort((a, b) => (a.id > b.id ? 1 : -1))}
                itemListRenderer={(listProps) =>
                  this.mappingListRenderer(listProps)
                }
                itemRenderer={itemRenderer}
                popoverProps={{ minimal: true }}
                filterable={false}
                onItemSelect={(item) =>
                  this.onItemSelect(item, colLabel, colValue)
                }
              >
                <Button
                  fill
                  text={intl.formatMessage(messages.placeholder)}
                  className="MappingPropertyAssign__headerSelect__button"
                />
              </SelectWrapper>
            )}
          </div>
        )}
      </ColumnHeaderCell>
    );
  }

  renderCell(rowIndex, colIndex, style) {
    const { csvData } = this.props;
    const row = csvData[rowIndex] || [];
    const value = row.length >= colIndex ? row[colIndex] : null;

    return (
      <Cell style={style}>
        <TruncatedFormat detectTruncation>{value || ''}</TruncatedFormat>
      </Cell>
    );
  }

  render() {
    const { columnLabels, mappings } = this.props;
    const columnAssignments = mappings.getColumnAssignments();

    return (
      <div className="MappingPropertyAssign TableViewer">
        <Table
          numRows={10}
          enableGhostCells
          enableRowHeader={false}
          enableRowResizing={false}
          enableColumnResizing={false}
          selectionModes="NONE"
          defaultColumnWidth={180}
          renderMode="none"
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
              style.backgroundColor = mappings.getMapping(colValue.id).color;
            }

            return (
              <Column
                key={colLabel}
                id={i}
                name={colLabel}
                cellRenderer={(rowIndex, colIndex) =>
                  this.renderCell(rowIndex, colIndex, style, colError)
                }
                columnHeaderCellRenderer={() =>
                  this.renderHeaderCell(colLabel, colValue, style, colError)
                }
              />
            );
          })}
        </Table>
      </div>
    );
  }
}

export default compose(injectIntl)(MappingPropertyAssign);
