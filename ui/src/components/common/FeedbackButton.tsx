import { FC, ComponentProps } from 'react';
import { useSelector } from 'react-redux';
import { AnchorButton, IAnchorButtonProps } from '@blueprintjs/core';

import { selectCurrentRole, selectFeedbackUrl } from 'selectors';
import { HintPopover } from 'components/common';

type FeedbackButtonProps = Omit<IAnchorButtonProps, 'type'> & {
  type: string;
  entityUrl?: string;
  popoverContent?: ComponentProps<typeof HintPopover>['content'];
};

const FeedbackButton: FC<FeedbackButtonProps> = ({
  type,
  entityUrl,
  children,
  popoverContent,
  ...rest
}) => {
  let url = useSelector((state) => selectFeedbackUrl(state, type));
  const role = useSelector(selectCurrentRole);

  if (!url) {
    return null;
  }

  url = url.replace('{{role_email}}', encodeURIComponent(role.email || ''));
  url = url.replace('{{entity_url}}', encodeURIComponent(entityUrl || ''));

  const button = (
    <AnchorButton
      target="_blank"
      rel="noopener noreferrer"
      href={url}
      {...rest}
    >
      {children}
    </AnchorButton>
  );

  if (!popoverContent) {
    return button;
  }

  return (
    <HintPopover id={`feedback-button-${type}`} content={popoverContent}>
      {button}
    </HintPopover>
  );
};

export default FeedbackButton;
