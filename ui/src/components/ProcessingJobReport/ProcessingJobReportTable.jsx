import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';

import ProcessingJobReportTableRow from './ProcessingJobReportTableRow';

import './ProcessingJobReportTable.scss';

const messages = defineMessages({
  column_stage: {
    id: 'report.job.column.stage',
    defaultMessage: 'Stage',
  },
  column_total: {
    id: 'report.job.column.total',
    defaultMessage: 'Tasks',
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
    const { stages, intl, viewDetails, jumpToContext } = this.props;
    const TH = ({ field }) => <th>{intl.formatMessage(messages[`column_${field}`])}</th>;

    return (
      <table className="ProcessingJobReportTable data-table">
        <thead>
          <tr>
            <th />
            <TH className="header" field="stage" />
            <TH className="header" field="total" />
            <TH className="header" field="start" />
            <TH className="header" field="end" />
            <TH className="header" field="error" />
            <TH className="header" field="updated_at" />
          </tr>
        </thead>
        <tbody>
          {stages.map(stage => (
            <ProcessingJobReportTableRow
              stage={stage}
              key={stage.name}
              viewDetails={viewDetails}
              jumpToContext={jumpToContext}
            />
          ))}
        </tbody>
      </table>
    );
  }
}

export default compose(
  injectIntl,
)(ProcessingJobReportTable);
