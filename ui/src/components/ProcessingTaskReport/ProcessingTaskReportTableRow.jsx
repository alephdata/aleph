import _ from 'lodash';
import React, { Component } from 'react';
import { Checkbox } from '@blueprintjs/core';
import c from 'classnames';

import { Date, Entity } from 'src/components/common';

class Operation extends React.PureComponent {
  render() {
    const { operation } = this.props;
    return <span>{operation}</span>;
  }
}

class Status extends React.PureComponent {
  render() {
    const { status } = this.props;
    return <span>{status}</span>;
  }
}

class ProcessingTaskReportTableRow extends Component {
  render() {
    const { report, model } = this.props;
    const {
      operation,
      status,
      // job,
      has_error: hasError,
      updated_at: updatedAt,
      entity,
    } = report;

    let entityDisplay;
    try {
      entityDisplay = <Entity.Link entity={model.getEntity(entity)} icon />;
    } catch {
      entityDisplay = entity.id;
    }
    const { updateSelection, selection } = this.props;
    const selectedIds = _.map(selection || [], 'id');
    const isSelected = selectedIds.indexOf(report.id) > -1;
    const rowClass = c('ProcessingTaskReportTableRow', 'nowrap', { error: hasError });
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
          <td className="entity">{entityDisplay}</td>
          <td className="operation">
            <Operation operation={operation} />
          </td>
          <td className="date">
            <Date value={updatedAt} showTime />
          </td>
        </tr>
      </>
    );
  }
}

export default ProcessingTaskReportTableRow;
