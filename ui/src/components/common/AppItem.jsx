import React, { PureComponent } from 'react';
import { Classes, MenuItem } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { selectMetadata } from 'selectors';

class AppItem extends PureComponent {
  render() {
    const { app } = this.props;
    if (!app) {
      return null;
    }
    const message = (
      <FormattedMessage
        id="footer.aleph"
        defaultMessage="Aleph {version}"
        values={{
          version: app.version,
        }}
      />
    );
    return (
      <MenuItem
        className={Classes.TEXT_DISABLED}
        icon="code"
        text={message}
        href="https://docs.alephdata.org"
      />
    );
  }
}

const mapStateToProps = (state) => ({
  app: selectMetadata(state).app,
});

export default connect(mapStateToProps)(AppItem);
