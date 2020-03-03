import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';

import ProcessingJobReportTableRow from './ProcessingJobReportTableRow';

import './ProcessingJobReportTable.scss';

const messages = defineMessages({
  column_operation: {
    id: 'report.job.column.operation',
    defaultMessage: 'Operation',
  },
  column_total: {
    id: 'report.job.column.total',
    defaultMessage: 'Total tasks',
  },
  column_start: {
    id: 'report.job.column.start',
    defaultMessage: 'Running',
  },
  column_end: {
    id: 'report.job.column.end',
    defaultMessage: 'Finished',
  },
  column_error: {
    id: 'report.job.column.error',
    defaultMessage: 'Errors',
  },
  column_updated_at: {
    id: 'report.job.column.updated_at',
    defaultMessage: 'Last activity',
  },
});

class ProcessingJobReportTable extends Component {
  render() {
    const { operations, intl, viewDetails, jumpToContext } = this.props;
    const TH = ({ field, className }) => (
      <th className={className}>
        {intl.formatMessage(messages[`column_${field}`])}
      </th>
    );

    return (
      <table className="ProcessingJobReportTable data-table">
        <thead>
          <tr>
            <th />
            <TH className="header" field="operation" />
            <TH className="header" field="total" />
            <TH className="header-light" field="start" />
            <TH className="header-light" field="end" />
            <TH className="header-light" field="error" />
            <TH className="header" field="updated_at" />
          </tr>
        </thead>
        <tbody>
          {operations.map((operation) => (
            <ProcessingJobReportTableRow
              operation={operation}
              key={operation.name}
              viewDetails={viewDetails}
              jumpToContext={jumpToContext}
            />
          ))}
        </tbody>
      </table>
    );
  }
}

export default compose(injectIntl)(ProcessingJobReportTable);
