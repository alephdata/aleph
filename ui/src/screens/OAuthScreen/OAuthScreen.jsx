import React from 'react';
import queryString from 'query-string';
import { Navigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { loginWithToken } from 'actions/sessionActions';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Dialog, DialogBody } from '@blueprintjs/core';

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
    const { location, navigate } = this.props;
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
            <p>
              Your user account has been deactivated and you cannot sign in
              until it is reactivated. We deactivate accounts if they have been
              inactive for more than 24 months or violate our terms of service.
              In order to reactivate your account please contact us using{' '}
              <a href="#">this form</a>.
            </p>
          </DialogBody>
        </Dialog>
      );
    }

    const nextPath = query.next || '/';
    return <Navigate to={nextPath} replace />;
  }
}

const mapStateToProps = ({ session }) => ({ session });

const mapDispatchToProps = { loginWithToken };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(OAuthScreen);
