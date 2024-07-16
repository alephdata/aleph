import { FC } from 'react';
import { AnchorButton, Intent } from '@blueprintjs/core';

type RoleBlockedMessageProps = {
  message: string;
  link?: string;
  linkLabel?: string;
};

const RoleBlockedMessage: FC<RoleBlockedMessageProps> = ({
  message,
  link,
  linkLabel,
}) => {
  return (
    <>
      <p>{message}</p>
      {link && linkLabel && (
        <AnchorButton href={link} intent={Intent.PRIMARY} rel="noreferrer">
          {linkLabel}
        </AnchorButton>
      )}
    </>
  );
};

export default RoleBlockedMessage;
