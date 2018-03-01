import React from 'react';
import {FormattedMessage} from 'react-intl';

import './Footer.css';

class Footer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <footer className="Footer">
        <p>
          <strong>ℵ</strong> <FormattedMessage id='footer.aleph'
                                               defaultMessage="aleph Mk II"/>
          <span className="pt-text-muted"> • </span>
          <span>
              <a href="https://github.com/alephdata/aleph"><i className="fa fa-fw fa-github"/></a>
            {' '}
            <a href="https://github.com/alephdata/aleph"><FormattedMessage id='footer.source.code'
                                                                           defaultMessage="Source Code"/></a>
            </span>
          <span className="pt-text-muted"> • </span>
          <span>
              <a href="https://github.com/alephdata/aleph/wiki/User-manual"><i className="fa fa-fw fa-book"/></a>
            {' '}
            <a href="https://github.com/alephdata/aleph/wiki/User-manual">
                <FormattedMessage id='footer.documentation'
                                  defaultMessage="Documentation"/></a>
            </span>
        </p>
      </footer>
    );
  }
}

export default Footer;