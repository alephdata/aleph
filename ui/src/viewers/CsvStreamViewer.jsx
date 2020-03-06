import React from 'react';
import { connect } from 'react-redux';
import fetchCsvData from 'src/util/fetchCsvData';
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
      parser: null,
    };
    this.renderCell = this.renderCell.bind(this);
    this.onVisibleCellsChange = this.onVisibleCellsChange.bind(this);
    this.processCsvResults = this.processCsvResults.bind(this);
  }

  componentDidMount() {
    const { document } = this.props;
    const url = document.links.csv;
    fetchCsvData(url, this.processCsvResults);
  }

  componentDidUpdate() {
    const { rows, requestedRow, parser } = this.state;
    if (rows.length < requestedRow && parser !== null) {
      parser.resume();
    }
  }

  processCsvResults(results, parser) {
    this.setState((previousState) => {
      const rows = previousState.rows.concat(results.data);
      const rowIndex = rows.length;
      if (rowIndex > previousState.requestedRow) {
        parser.pause();
      }
      return { rows, parser };
    });
  }

  onVisibleCellsChange(row) {
    const { requestedRow } = this.state;
    // If we are scrolling to the end. Time to load more rows.
    if ((row.rowIndexEnd + 50) > requestedRow) {
      const { document } = this.props;
      const rowCount = parseInt(document.getFirst('rowCount'), 10);
      // Max row count should not exceed the number of rows in the csv file
      const nextRow = Math.min(rowCount, requestedRow + 100);
      if (nextRow > requestedRow) {
        this.setState((previousState) => ({
          requestedRow: Math.min(rowCount, previousState.requestedRow + 100),
        }));
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
