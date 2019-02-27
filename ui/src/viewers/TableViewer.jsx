import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
  Cell, Column, Table, TableLoadingOption, TruncatedFormat,
} from '@blueprintjs/table';

import { queryEntities } from 'src/actions';
import Query from 'src/app/Query';
import { selectEntitiesResult } from 'src/selectors';
import './TableViewer.scss';


const mapStateToProps = (state, ownProps) => {
  const { document, location, queryText } = ownProps;
  let query = Query.fromLocation('entities', location, {}, 'document')
    .sortBy('properties.index', 'asc')
    .setFilter('properties.table', document.id)
    .setFilter('schemata', 'Record');

  if (queryText) {
    query = query.setString('q', queryText);
  }

  return {
    query,
    result: selectEntitiesResult(state, query),
  };
};

@connect(mapStateToProps, { queryEntities })
@withRouter
export default class TableViewer extends Component {
  constructor(props) {
    super(props);
    this.state = { requestedRow: 0 };
    this.renderCell = this.renderCell.bind(this);
    this.onVisibleCellsChange = this.onVisibleCellsChange.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { result } = nextProps;
    return {
      requestedRow: Math.max(prevState.requestedRow, result.results.length),
    };
  }

  componentDidMount() {
    this.fetchRecords();
  }

  componentDidUpdate() {
    this.fetchRecords();
  }

  onVisibleCellsChange(row) {
    const { result } = this.props;
    const maxResult = this.state.requestedRow;
    if (result.limit !== undefined && row.rowIndexEnd >= (maxResult - 10)) {
      const nextResult = result.offset + (result.limit * 2);
      this.setState({ requestedRow: nextResult });
    }
  }

  fetchRecords() {
    const { result, query } = this.props;
    if (query.path && result.shouldLoad) {
      this.props.queryEntities({ query });
    } else if (this.state.requestedRow > result.results.length) {
      if (!result.isLoading && result.next) {
        this.props.queryEntities({ query, next: result.next });
      }
    }
  }

  renderCell(rowIndex, colIndex) {
    const { result } = this.props;
    const loading = rowIndex >= result.results.length;
    const value = JSON.parse(result.results[rowIndex].getProperty('cells'))[colIndex];
    return (
      <Cell loading={loading}>
        <TruncatedFormat detectTruncation>
          {value || ''}
        </TruncatedFormat>
      </Cell>
    );
  }

  render() {
    const { document, result } = this.props;
    const loadingOptions = [];
    if (document.id === undefined) {
      return null;
    }
    if (result.total === undefined) {
      loadingOptions.push(TableLoadingOption.CELLS);
    }
    return (
      <div className="TableViewer">
        <Table
          numRows={result.total}
          enableGhostCells
          enableRowHeader
          loadingOptions={loadingOptions}
          onVisibleCellsChange={this.onVisibleCellsChange}
        >
          {JSON.parse(document.getProperty('columns').toString())
            .map((column, i) => (
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
