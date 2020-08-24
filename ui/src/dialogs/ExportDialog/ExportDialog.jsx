import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Alert, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { deleteEntity } from 'src/actions';
import { showErrorToast, showSuccessToast } from 'src/app/toast';

const messages = defineMessages({
  button_confirm: {
    id: 'exports.dialog.confirm',
    defaultMessage: 'Export',
  },
  button_cancel: {
    id: 'exports.dialog.cancel',
    defaultMessage: 'Cancel',
  },
  export_success: {
    id: 'exports.dialog.success',
    defaultMessage: 'Your export has begun.',
  },
  dashboard_link: {
    id: 'exports.dialog.dashboard_link',
    defaultMessage: 'View progress',
  },
});

export class ExportDialog extends Component {
  constructor(props) {
    super(props);
    this.onExport = this.onExport.bind(this);
  }

  async onExport() {
    const { history, intl, onExport, toggleDialog } = this.props;
    try {
      await onExport();
      showSuccessToast({
        message: intl.formatMessage(messages.export_success),
        action: {
          small: true,
          icon: 'share',
          text: intl.formatMessage(messages.dashboard_link),
          onClick: () => history.push('/exports')
        }
      });
      toggleDialog();
    } catch (e) {
      showErrorToast(e);
    }

  }

  render() {
    const { intl, isOpen, toggleDialog } = this.props;

    return (
      <Alert
        isOpen={isOpen}
        className="ExportDialog"
        icon="export"
        intent={Intent.PRIMARY}
        cancelButtonText={intl.formatMessage(messages.button_cancel)}
        confirmButtonText={intl.formatMessage(messages.button_confirm)}
        onCancel={toggleDialog}
        onConfirm={this.onExport}
      >
        <FormattedMessage
          id="export.dialog.text"
          defaultMessage={`<bold>Click the button below to initiate your export.</bold>
            {br}{br}
            Exports may take some time to generate, so you will receive a notification and an email with a download link once it is ready.
            {br}{br}
            In the meantime, please refrain from attempting to repeat this export request.
          `}
          values={{
            bold: (...chunks) => <b>{chunks}</b>,
            br: <br/>
          }}
        />
      </Alert>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { deleteEntity }),
  injectIntl,
)(ExportDialog);
