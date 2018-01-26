import React, { Component } from 'react';
import { connect } from 'react-redux';
import Waypoint from 'react-waypoint';

import { fetchDocumentRecords, fetchNextDocumentRecords } from 'src/actions';
import ScreenLoading from 'src/components/common/ScreenLoading';
import SectionLoading from 'src/components/common/SectionLoading';

class Table extends Component {
  render() {
    const { columnNames, records } = this.props;

    return (
      <table className="pt-table pt-bordered">
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
    );
  }
}

class TableViewer extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isExpanding: false,
    };
    
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  componentDidMount() {
    this.fetchRecords();
  }

  // TODO Handle prop change: cancel fetches, reset state, start again.

  async fetchRecords() {
    const { document, fetchDocumentRecords } = this.props;

    const { data } = await fetchDocumentRecords({ id: document.id });
    this.setState({
      result: data,
     });
  }

  async bottomReachedHandler() {
    const { fetchNextDocumentRecords } = this.props;
    let { isExpanding, result } = this.state;

    if (!isExpanding && result.next) {
      this.setState({ isExpanding: true });
      const { data } = await fetchNextDocumentRecords({ next: result.next })
      const newResult = {
        ...data,
        results: result.results.concat(data.results),
      };
      this.setState({
          result: newResult,
          isExpanding: false,
      });
    };
  }

  render() {
    const { document } = this.props;
    const { result, isExpanding } = this.state;

    if (result === undefined) {
      return (
        <ScreenLoading />
      );
    }

    const columnNames = document.columns;

    return (
      <div className="TableViewer">
        <Table columnNames={columnNames} records={result.results} />
        {!isExpanding && result.next && (
          <Waypoint
            onEnter={this.bottomReachedHandler}
            bottomOffset="-600px"
            scrollableAncestor={window}
          />
        )}
        {isExpanding && (
          <SectionLoading />
        )}
      </div>
    );
  }
}

const mapStateToProps = null;
export default connect(mapStateToProps, { fetchDocumentRecords, fetchNextDocumentRecords })(TableViewer);
