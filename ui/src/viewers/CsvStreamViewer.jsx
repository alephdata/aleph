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
    this.state = {
      requestedRow: 400,
      rows: [],
      isLoading: false,
      parser: null
    };
    this.renderCell = this.renderCell.bind(this);
    this.onVisibleCellsChange = this.onVisibleCellsChange.bind(this);
  }

  componentDidMount() {
    this.fetchRecords();
  }

  componentDidUpdate() {
    this.fetchRecords();
  }

  onVisibleCellsChange(row) {
    const { isLoading, requestedRow } = this.state;
    // If we are scrolling to the end. Time to load more rows.
    if (isLoading && (row.rowIndexEnd + 50) > requestedRow) {
      const { document } = this.props;
      const rowCount = parseInt(document.getFirst('rowCount'), 10);
      // Max row count should not exceed the number of rows in the csv file
      let nextRow = Math.min(rowCount, requestedRow + 100);
      if (nextRow > requestedRow) {
        this.setState((previousState) => {
          requestedRow = Math.min(rowCount, previousState.requestedRow + 100);
          return { requestedRow };
        });
      }
    }
  }

  fetchRecords() {
    const { document } = this.props;
    const { rows, requestedRow, isLoading, parser } = this.state;
    if (!isLoading) {
      this.setState({ isLoading: true });
    }
    if (rows.length < requestedRow) {
      if (isLoading && parser !== null) {
        parser.resume();
      } else {
        const url = document.links.csv;
        // set chunk size to 100 KB
        Papa.RemoteChunkSize = 1024 * 100;
        Papa.parse(url, {
          download: true,
          delimiter: ',',
          newline: '\n',
          encoding: 'utf-8',
          chunk: (results, parser) => {
            this.setState((previousState) => {
              const rows = previousState.rows.concat(results.data);
              const rowIndex = rows.length;
              if (rowIndex > previousState.requestedRow) {
                parser.pause();
              }
              return { rows, parser };
            });
          },
        });
      }
    }
  }

  renderCell(rowIndex, colIndex) {
    const row = this.state.rows[rowIndex];
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
