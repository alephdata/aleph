import _ from 'lodash';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {Cell, Column, Table, TableLoadingOption, TruncatedFormat} from "@blueprintjs/table";

import Query from 'src/app/Query';
import {queryDocumentRecords} from 'src/actions';
import {selectDocumentRecordsResult} from 'src/selectors';

import './TableViewer.scss';


class TableViewer extends Component {
  constructor(props) {
    super(props);
    this.state = { requestedRow: 0 };
    this.renderCell = this.renderCell.bind(this);
    this.onVisibleCellsChange = this.onVisibleCellsChange.bind(this);
  }
  
  static getDerivedStateFromProps(nextProps, prevState) {
    const { result } = nextProps;
    return {
      requestedRow: Math.max(prevState.requestedRow, result.results.length)
    }
  }

  componentDidMount() {
    this.fetchRecords();
  }

  componentDidUpdate(prevProps) {
    this.fetchRecords();
  }

  fetchRecords() {
    const { result, query } = this.props;
    if (query.path && result.shouldLoad) {
      this.props.queryDocumentRecords({query})
    } else if (this.state.requestedRow > result.results.length) {
      if (!result.isLoading && result.next) {
        this.props.queryDocumentRecords({query, next: result.next})
      }
    }
  }

  onVisibleCellsChange(row) {
    const { result } = this.props;
    const maxResult = this.state.requestedRow;
    if (result.limit !== undefined && row.rowIndexEnd >= (maxResult - 10)) {
      const nextResult = result.offset + (result.limit * 2);
      this.setState({requestedRow: nextResult});
    }
  }

  renderCell(rowIndex, colIndex) {
    const { result, document } = this.props;
    const columnName = document.columns[colIndex];
    const loading = rowIndex >= result.results.length;
    const value = _.get(result.results, [rowIndex, 'data', columnName], '');
    return <Cell loading={loading}>
      <TruncatedFormat detectTruncation={true}>
        {value || ''}
      </TruncatedFormat>
    </Cell>
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
        <Table numRows={result.total}
               enableGhostCells={true}
               enableRowHeader={true}
               loadingOptions={loadingOptions}
               onVisibleCellsChange={this.onVisibleCellsChange}>
          {document.columns.map((column, i) => 
            <Column key={i} id={i} name={column} cellRenderer={this.renderCell} />  
          )}
        </Table>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document, location, queryText } = ownProps;
  const path = document.links ? document.links.records : null;
  let query = Query.fromLocation(path, location, {}, 'document').limit(50);

  if (queryText) {
    query = query.setString('q', queryText);
  }

  return {
    query: query,
    result: selectDocumentRecordsResult(state, query),
  }
};

TableViewer = connect(mapStateToProps, { queryDocumentRecords })(TableViewer);
TableViewer = withRouter(TableViewer);
export default TableViewer;
