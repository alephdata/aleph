import React, { useRef } from 'react';
import { Button, InputGroup } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { showSuccessToast } from 'app/toast';

const messages = defineMessages({
  success: {
    id: 'clipboard.copy.after',
    defaultMessage: 'Successfully copied to clipboard',
  },
});

export default function ClipboardInput(props) {
  const intl = useIntl();
  const inputRef = useRef(null);
  const tooltip = (
    <FormattedMessage
      id="clipboard.copy.before"
      defaultMessage="Copy to clipboard"
    />
  );

  return (
    <InputGroup
      inputRef={inputRef}
      leftIcon={props.icon}
      id={props.id}
      readOnly
      value={props.value}
      rightElement={
        <Tooltip content={tooltip}>
          <Button
            onClick={() => {
              inputRef.current.select();
              document.execCommand('copy');
              showSuccessToast(intl.formatMessage(messages.success));
            }}
            icon="clipboard"
            minimal
          />
        </Tooltip>
      }
    />
  );
}
