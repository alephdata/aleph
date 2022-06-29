{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component } from 'react';
import {
  Cell, Column, Table, TruncatedFormat,
} from '@blueprintjs/table';
import { csvContextLoader } from 'components/common';

import './TableViewer.scss';


class TableViewer extends Component {
  constructor(props) {
    super(props);
    this.renderCell = this.renderCell.bind(this);
    this.onVisibleCellsChange = this.onVisibleCellsChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    // Blueprint Table doesn't consistently re-render on initial data load.
    //  so force reloads the component to render the table correctly with incoming data
    const initialDataLoad = prevProps.rows.length === 0 && this.props.rows.length !== 0;
    if (initialDataLoad) {
      this.forceUpdate();
    }
  }

  onVisibleCellsChange(row) {
    const { fetchMoreRows, requestedRow } = this.props;
    // If we are scrolling to the end. Time to load more rows.
    if ((row.rowIndexEnd + 50) > requestedRow) {
      fetchMoreRows()
    }
  }

  renderCell(rowIndex, colIndex) {
    const row = this.props.rows[rowIndex];
    const value = row ? row[colIndex] : undefined;
    return (
      <Cell loading={value === undefined}>
        <TruncatedFormat detectTruncation>
          {value || ''}
        </TruncatedFormat>
      </Cell>
    );
  }

  render() {
    const { columns, totalRowCount } = this.props;

    return (
      <div className="TableViewer">
        <Table
          numRows={totalRowCount}
          enableGhostCells
          enableRowHeader
          onVisibleCellsChange={this.onVisibleCellsChange}
        >
          {columns.map((column, i) => (
            <Column
              key={column}
              id={i}
              name={column}
              cellRenderer={this.renderCell}
            />
          ))}
        </Table>
      </div>
    );
  }
}

export default csvContextLoader(TableViewer);
