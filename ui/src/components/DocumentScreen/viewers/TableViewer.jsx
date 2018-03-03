import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Waypoint from 'react-waypoint';

import { queryDocumentRecords } from 'src/actions';
import { selectDocumentRecordsResult } from 'src/selectors';
import Query from 'src/components/search/Query';
import SectionLoading from 'src/components/common/SectionLoading';
import { DocumentToolbar } from 'src/components/Toolbar';

class Table extends Component {
  render() {
    const { columnNames, records } = this.props;

    return (
      <React.Fragment>
        <DocumentToolbar document={document}/>
        <div style={{width: '100%', flex: 1, overflow: 'auto'}}>
          <table className="pt-html-table pt-html-table-bordered">
            <thead>
              <tr>
                {columnNames.map((columnName, index) => (
                  <th key={columnName}>
                    {columnName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  {columnNames.map(columnName => (
                    <td key={columnName}>
                      {record.data[columnName] || '–'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </React.Fragment>
    );
  }
}

class TableViewer extends Component {
  constructor(props) {
    super(props);
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  componentDidMount() {
    this.fetchRecords();
  }

  // TODO Handle prop change: cancel fetches, reset state, start again.

  fetchRecords() {
    const { queryDocumentRecords, query } = this.props;
    if (query.path) {
      queryDocumentRecords({query})
    }
  }

  bottomReachedHandler() {
    const { query, result, queryDocumentRecords } = this.props;

    if (!result.isLoading && result.next) {
      queryDocumentRecords({query, next: result.next})
    };
  }

  render() {
    const { document, result } = this.props;
    const columnNames = document.columns;

    return (
      <div className="TableViewer">
        <Table columnNames={columnNames} records={result.results} />
        {!result.isLoading && result.next && (
          <Waypoint
            onEnter={this.bottomReachedHandler}
            bottomOffset="-600px"
            scrollableAncestor={window}
          />
        )}
        {result.isLoading && (
          <SectionLoading />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document, location } = ownProps;
  const path = document.links ? document.links.records : null;
  const query = Query.fromLocation(path, location, {}, 'table:')
    .limit(50);

  return {
    query: query,
    result: selectDocumentRecordsResult(state, query),
    model: state.metadata.schemata[ownProps.schema]
  }
}

TableViewer = connect(mapStateToProps, { queryDocumentRecords })(TableViewer);
TableViewer = withRouter(TableViewer);
export default TableViewer;
