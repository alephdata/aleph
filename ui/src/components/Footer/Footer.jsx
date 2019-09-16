import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon } from '@blueprintjs/core';

import './Footer.scss';

export default function Footer(props) {
  const { metadata } = props;

  return (
    <footer id="Footer" className="Footer">
      <div className="info">
        <FormattedMessage
          id="footer.aleph"
          defaultMessage="Aleph {version}"
          values={{
            version: metadata.app.version,
          }}
        />
        <span className="bp3-text-muted"> • </span>
        <span>
          <a href="https://docs.alephdata.org/guide/getting-started">
            <Icon icon="help" iconSize={14} />
          </a>
          {' '}
          <a href="https://docs.alephdata.org/guide/getting-started">
            <FormattedMessage
              id="footer.help"
              defaultMessage="Help"
            />
          </a>
        </span>
        <span className="bp3-text-muted"> • </span>
        <span>
          <a href="https://github.com/alephdata/aleph">
            <Icon icon="git-repo" iconSize={14} />
          </a>
          {' '}
          <a href="https://github.com/alephdata/aleph">
            <FormattedMessage
              id="footer.code"
              defaultMessage="Code"
            />
          </a>
        </span>
      </div>
    </footer>
  );
}
