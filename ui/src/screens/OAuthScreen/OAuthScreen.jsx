import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';

import queryString from "query-string";
import {loginWithToken} from "src/actions/sessionActions";


class OAuthScreen extends Component {
  componentDidMount() {
    const parsedHash = queryString.parse(window.location.hash);
    if (parsedHash.token) {
      this.props.loginWithToken(parsedHash.token);
      return null;
    }
  }

  render() {
    const { session } = this.props;
    if (session.loggedIn) {
      return <Redirect to="/"/>;
    } else {
      window.location.replace('/');
      return null;
    }
  }
}

const mapStateToProps = ({ session }) => ({ session });

OAuthScreen = connect(mapStateToProps, {loginWithToken})(OAuthScreen);
export default OAuthScreen;
