import React, { useState, useRef } from 'react';
import { Button, InputGroup, Tooltip } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';


export default function ClipboardInput(props) {
  const inputRef = useRef(null);
  const titles = [
    <FormattedMessage
      id="clipboard.copy.before"
      defaultMessage="Copy to clipboard"

    />, <FormattedMessage
      id="clipboard.copy.after"
      defaultMessage="Copied to clipboard!"

    />,
  ];
  const [title, setTitle] = useState(0);
  return (
    <InputGroup
      inputRef={inputRef}
      leftIcon={props.icon}
      id={props.id}
      readOnly
      value={props.value}
      rightElement={(
        <Tooltip content={titles[title]}>
          <Button
            onClick={() => {
                inputRef.current.select();
                document.execCommand('copy');
                setTitle(1);
            }}
            icon="clipboard"
            minimal
          />
        </Tooltip>
      )}
    />
  );
}
