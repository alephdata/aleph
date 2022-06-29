{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import { defineMessages, injectIntl } from "react-intl";
import { Button, Intent } from "@blueprintjs/core";

const messages = defineMessages({
  cancel: {
    id: 'document.upload.cancel',
    defaultMessage: 'Cancel',
  }
});

function DocumentUploadActionsPending({ intl, onClose }) {
  return <div className="bp3-dialog-footer-actions">
      <Button
        type="button"
        icon={"cross"}
        intent={Intent.DANGER}
        text={intl.formatMessage(messages.cancel)}
        onClick={() => onClose()}
      />
    </div>
}

export default injectIntl(DocumentUploadActionsPending);
