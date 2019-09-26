import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';

import './Footer.scss';


export default class Footer extends PureComponent {
  render() {
    const { metadata } = this.props;
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
              <FormattedMessage
                id="footer.help"
                defaultMessage="Help"
              />
            </a>
          </span>
          <span className="bp3-text-muted"> • </span>
          <span>
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
}
