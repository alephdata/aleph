import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { deleteProcessingJobReport } from 'src/actions';

const messages = defineMessages({
  button_confirm: {
    id: 'report.job.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'report.job.delete.cancel',
    defaultMessage: 'Cancel',
  },
  delete_error: {
    id: 'report.job.delete.error',
    defaultMessage:
      'An error occured while attempting to delete this job report.',
  },
});

export class ProcessingJobReportDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { jobId, history, location } = this.props;
    this.props.deleteProcessingJobReport(jobId);
    history.push({
      pathname: `${location.pathname}#mode=processing`,
    });
  }

  render() {
    const { intl } = this.props;
    return (
      <Alert
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        icon="trash"
        intent={Intent.DANGER}
        cancelButtonText={intl.formatMessage(messages.button_cancel)}
        confirmButtonText={intl.formatMessage(messages.button_confirm)}
        onCancel={this.props.toggleDialog}
        onConfirm={this.onDelete}
      >
        <FormattedMessage
          id="report.job.delete.question"
          defaultMessage="Are you sure you want to delete this job report? This action only deletes the reporting data, but nothing from the collections index itself."
        />
      </Alert>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { deleteProcessingJobReport }),
  injectIntl,
)(ProcessingJobReportDeleteDialog);
