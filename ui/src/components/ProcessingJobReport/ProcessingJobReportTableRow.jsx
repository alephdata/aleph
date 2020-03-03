import React, { Component } from 'react';
import c from 'classnames';
import { Icon, Spinner, Button, Tag } from '@blueprintjs/core';

import { Date, Count } from 'src/components/common';

import { jumpToDetails } from './util';

const OperationIcon = ({ finished, errors }) => {
  let renderedIcon = <Spinner size="14" />;
  if (errors) {
    renderedIcon = <Icon icon="error" />;
  } else if (finished) {
    renderedIcon = <Icon icon="tick-circle" />;
  }
  return renderedIcon;
};

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

    const intent = finished ? 'success' : 'warning';
    const label = finished ? 'Finished' : 'Running';
    const icon = <OperationIcon finished={finished} errors={!!errors} />;

    return (
      <tr className={rowClass}>
        <td className="tag">
          <Tag intent={intent} icon={icon}>
            {label}
          </Tag>
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
