import React from 'react';
import queryString from 'query-string';
import { Navigate } from 'react-router-dom';
import { loginWithToken } from 'actions/sessionActions';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';


class OAuthScreen extends React.Component {
  componentDidMount() {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if (parsedHash.token) {
      this.props.loginWithToken(parsedHash.token);
      return null;
    }
    return undefined;
  }

  render() {
    const { location } = this.props;
    const query = queryString.parse(location.search);
    const nextPath = query.next || '/';
    return <Navigate to={nextPath} />;
  }
}

const mapStateToProps = ({ session }) => ({ session });

const mapDispatchToProps = { loginWithToken };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(OAuthScreen);
