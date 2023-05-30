import { FC } from 'react';
import { useSelector } from 'react-redux';
import { AnchorButton, IAnchorButtonProps } from '@blueprintjs/core';

import { selectCurrentRole, selectFeedbackUrl } from 'selectors';

type FeedbackButtonProps = IAnchorButtonProps & {
  type: string;
  entityUrl: string;
};

const FeedbackButton: FC<FeedbackButtonProps> = ({
  type,
  entityUrl,
  children,
  ...rest
}) => {
  let url = useSelector((state) => selectFeedbackUrl(state, type));
  const role = useSelector(selectCurrentRole);

  if (!url) {
    return null;
  }

  url = url.replace('{{role_email}}', encodeURIComponent(role.email || ''));
  url = url.replace('{{entity_url}}', encodeURIComponent(entityUrl || ''));

  return (
    <AnchorButton
      target="_blank"
      rel="noopener noreferrer"
      href={url}
      {...rest}
    >
      {children}
    </AnchorButton>
  );
};

export default FeedbackButton;
