import React, { Component } from 'react';
import c from 'classnames';
import { Button } from '@blueprintjs/core';

import { Date, Count } from 'src/components/common';

import StatusTag from './StatusTag';
import { jumpToDetails } from './util';

class ProcessingJobReportTableRow extends Component {
  constructor(props) {
    super(props);
    this.viewDetails = this.viewDetails.bind(this);
  }

  viewDetails({ status }) {
    const { operation, jumpToContext } = this.props;
    let { context } = jumpToContext;
    context = { operation: operation.name, ...context, status };
    jumpToDetails({ ...jumpToContext, context });
  }

  render() {
    const { operation } = this.props;
    const {
      name,
      count,
      status,
      updated_at: updatedAt,
      has_errors: errors,
      finished,
    } = operation;

    const selectCount = (key) => {
      const res = status.filter((s) => s.name === key)[0];
      return res && res.count;
    };

    const renderStatus = (key) => (
      <td className={key}>
        <Button title="Show details" onClick={() => this.viewDetails({ status: key })}>
          {selectCount(key)}
        </Button>
      </td>
    );

    const rowClass = c('ProcessingJobReportTableRow', 'nowrap', {
      error: !!errors,
      // finished,
    });

    return (
      <tr className={rowClass}>
        <td className="tag">
          <StatusTag finished={finished} errors={errors} />
        </td>
        <td className="operation">
          {name}
        </td>
        <td className="total">
          <Button onClick={this.viewDetails}>
            <Count count={count} />
          </Button>
        </td>
        {renderStatus('start')}
        {renderStatus('end')}
        {renderStatus('error')}
        <td className="date">
          <Date value={updatedAt} showTime />
        </td>
      </tr>
    );
  }
}

export default ProcessingJobReportTableRow;
