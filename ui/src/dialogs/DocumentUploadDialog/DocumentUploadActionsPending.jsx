// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
