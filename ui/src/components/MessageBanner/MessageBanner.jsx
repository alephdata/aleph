import { Callout, Intent, Classes } from '@blueprintjs/core';
import { injectIntl } from 'react-intl';
import { RelativeTime } from 'components/common';

import './MessageBanner.scss';

const MESSAGE_INTENTS = {
  info: Intent.PRIMARY,
  warning: Intent.WARNING,
  error: Intent.DANGER,
  success: Intent.SUCCESS,
};

function Wrapper({ children }) {
  return (
    <div className="MessageBanner" role="status" aria-atomic="true">
      {children}
    </div>
  );
}

function MessageBanner({ message }) {
  if (!message) {
    return <Wrapper />;
  }

  const intent = MESSAGE_INTENTS[message.level] || Intent.WARNING;
  const updates = message.updates || [];

  const latestUpdate =
    updates.length > 0 ? updates[updates.length - 1] : message;

  return (
    <Wrapper>
      <Callout intent={intent} icon={null} className="MessageBanner__callout">
        <p>
          {message.title && (
            <>
              <strong className={Classes.HEADING}>{message.title}</strong>
              <br />
            </>
          )}

          <span
            dangerouslySetInnerHTML={{ __html: latestUpdate.safeHtmlBody }}
          />

          {latestUpdate.createdAt && (
            <span className="MessageBanner__meta">
              <RelativeTime date={latestUpdate.createdAt} />
            </span>
          )}
        </p>
      </Callout>
    </Wrapper>
  );
}

export default injectIntl(MessageBanner);
