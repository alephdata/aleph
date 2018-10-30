import React from 'react';
import {FormattedMessage} from 'react-intl';

import './Footer.css';

class Footer extends React.Component {

  render() {
    const {metadata} = this.props;

    return (
      <footer id="Footer" className="Footer">
        <div className="info">
          <strong>ℵ</strong>
          {' '}
          <FormattedMessage id='footer.aleph'
                            defaultMessage="aleph {version}"
                            values={{
                                version: metadata.app.version
                            }} />
          <span className="bp3-text-muted"> • </span>
          <span>
            <a href="https://github.com/alephdata/aleph/wiki/User-manual"><i className="fa fa-fw fa-book"/></a>
            {' '}
            <a href="https://github.com/alephdata/aleph/wiki/User-manual">
                <FormattedMessage id='footer.help'
                                  defaultMessage="Help"/>
            </a>
          </span>
          <span className="bp3-text-muted"> • </span>
          <span>
            <a href="https://github.com/alephdata/aleph"><i className="fa fa-fw fa-github"/></a>
            {' '}
            <a href="https://github.com/alephdata/aleph">
              <FormattedMessage id='footer.code'
                                defaultMessage="Code"/>
            </a>
          </span>
        </div>
      </footer>
    );
  }
}

export default Footer;