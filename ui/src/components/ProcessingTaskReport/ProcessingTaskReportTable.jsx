import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';

import { compose } from 'redux';
import { withRouter } from 'react-router';
import { SortableTH, ErrorSection } from 'src/components/common';
import ProcessingTaskReportTableRow from './ProcessingTaskReportTableRow';

import './ProcessingTaskReportTable.scss';

const messages = defineMessages({
  column_status: {
    id: 'report.column.status',
    defaultMessage: 'Status',
  },
  column_entity_name: {
    id: 'report.column.entity_name',
    defaultMessage: 'Document',
  },
  column_operation: {
    id: 'report.column.operation',
    defaultMessage: 'Operation',
  },
  column_updated_at: {
    id: 'report.column.updated_at',
    defaultMessage: 'Last activity',
  },
});

class ProcessingTaskReportTable extends Component {
  sortColumn(newField) {
    const { query, updateQuery } = this.props;
    const { field: currentField, direction } = query.getSort();
    // Toggle through sorting states: ascending, descending, or unsorted.
    if (currentField !== newField) {
      return updateQuery(query.sortBy(newField, 'asc'));
    }
    if (direction === 'asc') {
      updateQuery(query.sortBy(currentField, 'desc'));
    } else {
      updateQuery(query.sortBy(currentField, undefined));
    }
    return undefined;
  }

  render() {
    const { query, intl, result, model } = this.props;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (result.total === 0 && result.page === 1) {
      return null;
    }

    const results = result.results.filter((e) => e.id !== undefined);
    const TH = ({
      sortable, field, className, ...otherProps
    }) => {
      const { field: sortedField, direction } = query.getSort();
      return (
        <SortableTH
          sortable={sortable}
          className={className}
          sorted={sortedField === field && (direction === 'desc' ? 'desc' : 'asc')}
          onClick={() => this.sortColumn(field)}
          {...otherProps}
        >
          {intl.formatMessage(messages[`column_${field}`])}
        </SortableTH>
      );
    };

    return (
      <table className="ProcessingTaskReportTable data-table">
        <thead>
          <tr>
            <TH className="header-status" field="status" sortable />
            <TH className="header-document" field="entity_name" sortable />
            <TH className="header-operation" field="operation" sortable />
            <TH className="header-dates" field="updated_at" sortable />
          </tr>
        </thead>
        <tbody className={c({ updating: result.isLoading })}>
          {results.map(report => (
            <ProcessingTaskReportTableRow
              model={model}
              key={report.id}
              report={report}
            />
          ))}
        </tbody>
      </table>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(ProcessingTaskReportTable);
