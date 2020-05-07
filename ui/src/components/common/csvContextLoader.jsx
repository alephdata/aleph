import React from 'react';
import fetchCsvData from 'src/util/fetchCsvData';

const csvContextLoader = (Viewer) => (
  class extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        url: null,
        requestedRow: 400,
        rows: [],
        parser: null,
      };

      this.processCsvResults = this.processCsvResults.bind(this);
      this.fetchMoreRows = this.fetchMoreRows.bind(this);
    }

    componentDidMount() {
      this.fetchIfNeeded();
    }

    componentDidUpdate() {
      const { rows, requestedRow, parser } = this.state;
      if (rows.length < requestedRow && parser !== null) {
        parser.resume();
      }
      this.fetchIfNeeded();
    }

    fetchIfNeeded() {
      const { document } = this.props;
      const url = document.links?.csv || document.links?.file;
      if (url && this.state.url !== url) {
        fetchCsvData('https://aleph.occrp.org/api/2/archive?api_key=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1Ijo0NzM5LCJleHAiOjE1ODg5MjMzMjYsInIiOlsxLDIsNDczOSwxNzYyLDUsNDA3MSw3MDIxLDcwMzMsNzA3MCwzODM5XSwiYSI6ZmFsc2UsImIiOmZhbHNlLCJzIjoiL2FwaS8yL2FyY2hpdmUifQ.ji7zM31kZLAlVIzjNPt-w2qOeLrjDkBmeR63BwmveRk&claim=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyIjo0NzM5LCJoIjoiNzNmNmQ0MDc4Yzg5ZGM2ZmU1ZjFjZjA3N2EyMzlhMDQyZGNlYmFlZCIsImYiOiJTU19MZXR0ZXJzX29mX0NyZWRpdC5jc3YiLCJ0IjoidGV4dC9wbGFpbiJ9.iud7m5UXS6CuppvvRuBFxF7WF8-TlfO6fV4iSoYTSjI', this.processCsvResults);
        this.setState({ url });
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

    fetchMoreRows() {
      const { document } = this.props;
      const { requestedRow } = this.state;
      const rowCount = parseInt(document.getFirst('rowCount'), 10);

      // Max row count should not exceed the number of rows in the csv file
      const nextRow = Math.min(rowCount, requestedRow + 100);
      if (nextRow > requestedRow) {
        this.setState((previousState) => ({
          requestedRow: Math.min(rowCount, previousState.requestedRow + 100),
        }));
      }
    }

    render() {
      const { document } = this.props;
      const { requestedRow, rows } = this.state;
      if (document.id === undefined) {
        return null;
      }

      const columnsJson = document.getFirst('columns');
      const columnsFtm = columnsJson ? JSON.parse(columnsJson) : [];
      // HACK: Use the first row of the data as headers if nothing is in the
      // FtM metadata.
      const columnsHeader = rows.length > 0 ? rows[0] : [];
      const columns = columnsFtm.length ? columnsFtm : columnsHeader;

      return (
        <Viewer
          rows={rows}
          columns={columns}
          requestedRow={requestedRow}
          totalRowCount={parseInt(document.getFirst('rowCount'), 10)}
          fetchMoreRows={this.fetchMoreRows}
          {...this.props}
        />
      );
    }
  }
);

export default csvContextLoader;
