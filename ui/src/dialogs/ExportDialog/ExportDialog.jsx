{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}



import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import withRouter from 'app/withRouter'
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
    const { navigate, intl, onExport, toggleDialog } = this.props;
    try {
      await onExport();
      showSuccessToast({
        message: intl.formatMessage(messages.export_success),
        action: {
          small: true,
          icon: 'share',
          text: intl.formatMessage(messages.dashboard_link),
          onClick: () => navigate('/exports')
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
          defaultMessage={`<bold>Initiate your export.</bold>
            {br}{br}
            Exports take some time to generate. You will receive an email once the data is ready.
            {br}{br}
            Please trigger this export only once.
          `}
          values={{
            bold: (...chunks) => <b>{chunks}</b>,
            br: <br />
          }}
        />
      </Alert>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(ExportDialog);
