import React, { Component } from 'react';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import { queryDocumentRecords } from 'src/actions';
import { selectDocumentRecordsResult } from 'src/selectors';
import SectionLoading from 'src/components/common/SectionLoading';
import { DocumentToolbar } from 'src/components/Toolbar';


const messages = defineMessages({
  placeholder: {
    id: 'document.placeholder_table_filter',
    defaultMessage: 'Filter this table',
  },
});


class Table extends Component {
  render() {
    const { columnNames, records } = this.props;

    return (
      <React.Fragment>
        <div style={{width: '100%', flex: 1, overflow: 'auto'}}>
          <table className="data-table">
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
    this.updateQuery = this.updateQuery.bind(this);
    this.onQueryPrefixChange = debounce(this.onQueryPrefixChange.bind(this), 200);
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  componentDidMount() {
    this.fetchRecords();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchRecords();
    }
  }

  fetchRecords() {
    const { queryDocumentRecords, query } = this.props;
    if (query.path) {
      queryDocumentRecords({query})
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.replace({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  onQueryPrefixChange(prefix) {
    this.updateQuery(this.props.query.set('prefix', prefix));
  }

  bottomReachedHandler() {
    const { query, result, queryDocumentRecords } = this.props;
    if (!result.isLoading && result.next) {
      queryDocumentRecords({query, next: result.next})
    };
  }

  render() {
    const { document, result, intl } = this.props;
    const queryPlaceholder = intl.formatMessage(messages.placeholder);
    const columnNames = document.columns;

    return (
      <div className="TableViewer">
        <DocumentToolbar document={document}
                         queryText={this.props.query.getString('prefix')}
                         queryPlaceholder={queryPlaceholder}
                         onChangeQuery={this.onQueryPrefixChange} />
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
  const query = Query.fromLocation(path, location, {}, 'table')
    .limit(50);

  return {
    query: query,
    result: selectDocumentRecordsResult(state, query),
    model: state.metadata.schemata[ownProps.schema]
  }
}

TableViewer = connect(mapStateToProps, { queryDocumentRecords })(TableViewer);
TableViewer = withRouter(TableViewer);
TableViewer = injectIntl(TableViewer)
export default TableViewer;
