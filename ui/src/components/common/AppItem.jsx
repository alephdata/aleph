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
    const ftm_message = (
      <FormattedMessage
        id="footer.aleph"
        defaultMessage="followthemoney {version}"
        values={{
          version: app.ftm_version,
        }}
      />
    );
    return [
      <MenuItem
        className={Classes.TEXT_DISABLED}
        icon="code"
        text={message}
        href="https://docs.alephdata.org"
      />,
      <MenuItem
        className={Classes.TEXT_DISABLED}
        icon="code"
        text={ftm_message}
        href="https://docs.alephdata.org/developers/followthemoney"
      />,
    ];
  }
}

const mapStateToProps = (state) => ({
  app: selectMetadata(state).app,
});

export default connect(mapStateToProps)(AppItem);
