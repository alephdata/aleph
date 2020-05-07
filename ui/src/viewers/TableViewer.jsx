import React from 'react';
import {
  Cell, Column, Table, TruncatedFormat,
} from '@blueprintjs/table';
import csvContextLoader from 'src/components/common/csvContextLoader';

import './TableViewer.scss';


class TableViewer extends React.Component {
  constructor(props) {
    super(props);
    this.renderCell = this.renderCell.bind(this);
    this.onVisibleCellsChange = this.onVisibleCellsChange.bind(this);
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
