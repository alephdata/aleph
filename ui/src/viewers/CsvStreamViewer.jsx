import React from 'react';
import { connect } from 'react-redux';
import Papa from 'papaparse';
import {
  Cell, Column, Table, TruncatedFormat,
} from '@blueprintjs/table';


import './TableViewer.scss';

class CSVStreamViewer extends React.Component {
  constructor(props) {
    super(props);
    this.parser = null;
    this.state = { requestedRow: 400, rows: [] };
    this.renderCell = this.renderCell.bind(this);
    this.onVisibleCellsChange = this.onVisibleCellsChange.bind(this);
  }

  componentDidMount() {
    this.fetchRecords();
  }

  componentDidUpdate() {
    if (this.parser !== null) this.fetchRecords();
  }

  onVisibleCellsChange(row) {
    if (this.parser) {
      // If we are scrolling to the end. Time to load more rows.
      if ((row.rowIndexEnd + 50) > this.state.requestedRow) {
        const { document } = this.props;
        const rowCount = parseInt(document.getFirst('rowCount'), 10);
        // Max row count should not exceed the number of rows in the csv file
        let requestedRow = Math.min(rowCount, this.state.requestedRow + 100);
        if (requestedRow !== this.state.requestedRow) {
          this.setState((previousState) => {
            requestedRow = Math.min(rowCount, previousState.requestedRow + 100);
            return { requestedRow };
          });
        }
      }
    }
  }

  fetchRecords() {
    const { document } = this.props;
    const url = document.links.csv;
    if (this.state.rows.length < this.state.requestedRow) {
      if (this.parser !== null) {
        this.parser.resume();
      } else {
        // set chunk size to 500 KB
        Papa.RemoteChunkSize = 1024 * 500;
        Papa.parse(url, {
          download: true,
          delimiter: ',',
          newline: '\n',
          encoding: 'utf-8',
          // header: true,
          chunk: (results, parser) => {
            this.parser = parser;
            this.setState((previousState) => {
              const rows = previousState.rows.concat(results.data);
              const rowIndex = rows.length;
              if (rowIndex > previousState.requestedRow) {
                parser.pause();
              }
              return { rows };
            });
          },
        });
      }
    }
  }

  renderCell(rowIndex, colIndex) {
    const row = this.state.rows[rowIndex];
    const loading = !row;
    let value;
    if (row) {
      value = row[colIndex];
    }

    return (
      <Cell loading={loading}>
        <TruncatedFormat detectTruncation>
          {value || ''}
        </TruncatedFormat>
      </Cell>
    );
  }

  render() {
    const { document } = this.props;
    const { rows } = this.state;
    if (document.id === undefined) {
      return null;
    }
    const numRows = parseInt(document.getFirst('rowCount'), 10);
    const columnsJson = document.getFirst('columns');
    const columnsFtm = columnsJson ? JSON.parse(columnsJson) : [];
    // HACK: Use the first row of the data as headers if nothing is in the
    // FtM metadata.
    const columnsHeader = rows.length > 0 ? rows[0] : [];
    const columns = columnsFtm.length ? columnsFtm : columnsHeader;
    return (
      <div className="TableViewer">
        <Table
          numRows={numRows}
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

const mapStateToProps = (_state, ownProps) => {
  const { document } = ownProps;
  return {
    document,
  };
};

export default connect(mapStateToProps)(CSVStreamViewer);
