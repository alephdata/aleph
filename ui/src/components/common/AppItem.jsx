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
    const ftmMessage = (
      <FormattedMessage
        id="footer.ftm"
        defaultMessage="FollowTheMoney {version}"
        values={{
          version: app.ftm_version,
        }}
      />
    );

    return (
      <>
        <MenuItem
          className={Classes.TEXT_DISABLED}
          icon="code"
          text={message}
          href="https://docs.aleph.occrp.org"
        />
        <MenuItem
          className={Classes.TEXT_DISABLED}
          icon="code"
          text={ftmMessage}
          href="https://followthemoney.tech"
        />
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  app: selectMetadata(state).app,
});

export default connect(mapStateToProps)(AppItem);
