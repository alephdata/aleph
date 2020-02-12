import _ from 'lodash';
import React, { Component } from 'react';
import { Checkbox } from '@blueprintjs/core';
import c from 'classnames';

import { Date } from 'src/components/common';

class Stage extends React.PureComponent {
  render() {
    const { stage } = this.props;
    return <span>{stage}</span>;
  }
}

class Status extends React.PureComponent {
  render() {
    const { status } = this.props;
    return <span>{status}</span>;
  }
}

class ReportTableRow extends Component {
  render() {
    const { report } = this.props;
    const {
      stage,
      status,
      // job,
      has_error: hasError,
      end_at: endAt,
      start_at: startAt,
      error_at: errorAt,
      document,
    } = report;

    const { updateSelection, selection } = this.props;
    const selectedIds = _.map(selection || [], 'id');
    const isSelected = selectedIds.indexOf(report.id) > -1;
    const rowClass = c('ReportTableRow', 'nowrap', { error: hasError });
    return (
      <>
        <tr key={report.id} className={rowClass}>
          {updateSelection && (
            <td className="select">
              <Checkbox
                checked={isSelected}
                onChange={() => updateSelection(report)}
              />
            </td>
          )}
          <td className="status">
            <Status status={status} />
          </td>
          <td className="document">{document}</td>
          <td className="stage">
            <Stage stage={stage} />
          </td>
          <td className="date">
            <Date value={startAt} />
          </td>
          <td className="date">
            <Date value={endAt} />
          </td>
          <td className="date">
            <Date value={errorAt} />
          </td>
        </tr>
      </>
    );
  }
}

export default ReportTableRow;
