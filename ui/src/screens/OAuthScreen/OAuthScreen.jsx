import React from 'react';
import queryString from 'query-string';
import { Navigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { loginWithToken } from 'actions/sessionActions';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Dialog, DialogBody, AnchorButton, Intent } from '@blueprintjs/core';
import { RoleBlockedMessage } from 'components/common';

import withRouter from 'app/withRouter';

class OAuthScreen extends React.Component {
  componentDidMount() {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if (parsedHash.token) {
      this.props.loginWithToken(parsedHash.token);
      return null;
    }
  }

  render() {
    const { location, navigate, metadata } = this.props;
    const { message, link, link_label } = metadata.auth.role_blocked;
    const query = queryString.parse(location.search);

    if (query.status === 'error' && query.code === '403') {
      return (
        <Dialog
          title={
            <FormattedMessage
              id="oauth.role_blocked.dialog.title"
              defaultMessage="User account deactivated"
            />
          }
          icon="warning-sign"
          isOpen={true}
          onClose={() => navigate('/')}
          canOutsideClickClose={false}
        >
          <DialogBody>
            <RoleBlockedMessage
              message={message}
              link={link}
              linkLabel={link_label}
            />
          </DialogBody>
        </Dialog>
      );
    }

    const nextPath = query.next || '/';
    return <Navigate to={nextPath} replace />;
  }
}

const mapStateToProps = ({ metadata }) => ({ metadata });

const mapDispatchToProps = { loginWithToken };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(OAuthScreen);
