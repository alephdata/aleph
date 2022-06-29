{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import { FormattedMessage, injectIntl, defineMessages } from "react-intl";
import { Button, Intent } from "@blueprintjs/core";

const messages = defineMessages({
  close: {
    id: 'document.upload.close',
    defaultMessage: 'Close',
  },
  retry: {
    id: 'document.upload.retry',
    defaultMessage: 'Retry',
  }
});

function DocumentUploadActionsDone({ stats, onRetry, onClose, intl }) {
  return <section>
    <p>
      <FormattedMessage
        id="document.upload.notice"
        defaultMessage="The upload is complete. It will take a few moments for the documents to be processed and become searchable."
      />
    </p>
    {stats.errors > 0 && <p>
      <FormattedMessage
        id="document.upload.errors"
        defaultMessage="Some files couldn't be transferred. You can use the Retry button to restart all failed uploads."
      />
    </p>}
    <div className="bp3-dialog-footer-actions">
      {stats.errors > 0 && <Button
        type="button"
        intent={Intent.PRIMARY}
        icon={"repeat"}
        text={intl.formatMessage(messages.retry)}
        onClick={onRetry}
      />}
      <Button
        type="submit"
        intent={stats.errors <= 0 ? Intent.PRIMARY : Intent.NONE}
        icon={"tick"}
        text={intl.formatMessage(messages.close)}
        onClick={onClose}
      />
    </div>
  </section>
}

export default injectIntl(DocumentUploadActionsDone)
