import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, Classes, Intent } from '@blueprintjs/core';

const messages = defineMessages({
  cancel: {
    id: 'document.upload.cancel',
    defaultMessage: 'Cancel',
  },
});

function DocumentUploadActionsPending({ intl, onClose }) {
  return (
    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
      <Button
        type="button"
        icon={'cross'}
        intent={Intent.DANGER}
        text={intl.formatMessage(messages.cancel)}
        onClick={() => onClose()}
      />
    </div>
  );
}

export default injectIntl(DocumentUploadActionsPending);
