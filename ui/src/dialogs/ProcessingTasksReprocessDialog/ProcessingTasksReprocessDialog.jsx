import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Alert, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { triggerTaskReprocess } from 'src/actions';
import { showSuccessToast } from 'src/app/toast';


const messages = defineMessages({
  processing: {
    id: 'report.reprocessing.start',
    defaultMessage: 'Re-processing started.',
  },
  cancel: {
    id: 'report.reprocessing.cancel',
    defaultMessage: 'Cancel',
  },
  confirm: {
    id: 'report.reprocessing.confirm',
    defaultMessage: 'Start Re-processing',
  },
});

class ReprocessingDialog extends Component {
  constructor(props) {
    super(props);
    this.onConfirm = this.onConfirm.bind(this);
  }

  onConfirm() {
    const { intl, tasks } = this.props;
    this.props.triggerTaskReprocess(tasks);
    showSuccessToast(intl.formatMessage(messages.processing));
    this.props.toggleDialog();
  }

  render() {
    const { intl, isOpen, tasks } = this.props;
    const headline = `Re-process ${tasks.length} document tasks`;

    return (
      <Alert
        cancelButtonText={intl.formatMessage(messages.cancel)}
        confirmButtonText={intl.formatMessage(messages.confirm)}
        canEscapeKeyCancel
        canOutsideClickCancel
        icon="automatic-updates"
        intent={Intent.DANGER}
        isOpen={isOpen}
        onCancel={this.props.toggleDialog}
        onConfirm={this.onConfirm}
      >
        <h3>{headline}</h3>
        <p>
          <FormattedMessage
            id="report.reprocessing.alert.text"
            defaultMessage="Re-processing the selected documents might take some time. Start the process only once and allow time for it to complete."
          />
        </p>
      </Alert>
    );
  }
}

export default compose(
  connect(null, { triggerTaskReprocess }),
  injectIntl,
)(ReprocessingDialog);
