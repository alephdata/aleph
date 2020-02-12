import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';

import { compose } from 'redux';
import { withRouter } from 'react-router';
import { SortableTH, ErrorSection } from 'src/components/common';
import ReportTableRow from './ReportTableRow';

import './ReportTable.scss';

const messages = defineMessages({
  column_status: {
    id: 'report.column.status',
    defaultMessage: 'Status',
  },
  column_document: {
    id: 'report.column.document',
    defaultMessage: 'Document',
  },
  column_stage: {
    id: 'report.column.stage',
    defaultMessage: 'Stage',
  },
  column_start_at: {
    id: 'report.column.start_at',
    defaultMessage: 'Started at',
  },
  column_end_at: {
    id: 'report.column.end_at',
    defaultMessage: 'End at',
  },
  column_error_at: {
    id: 'report.column.error_at',
    defaultMessage: 'Error at',
  },
});

class ReportTable extends Component {
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
    const { query, intl, result } = this.props;
    const { updateSelection, selection } = this.props;

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
      <table className="ReportTable data-table">
        <thead>
          <tr>
            {updateSelection && (<th className="select" />)}
            <TH className="header-status" field="status" sortable />
            <TH className="header-document" field="document" sortable />
            <TH className="header-stage" field="stage" sortable />
            <TH className="header-dates" field="start_at" sortable />
            <TH className="header-dates" field="end_at" sortable />
            <TH className="header-dates" field="error_at" sortable />
          </tr>
        </thead>
        <tbody className={c({ updating: result.isLoading })}>
          {results.map(report => (
            <ReportTableRow
              key={report.id}
              report={report}
              updateSelection={updateSelection}
              selection={selection}
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
)(ReportTable);
