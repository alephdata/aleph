import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';

import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';
import queryString from "query-string";
import {defineMessages} from "react-intl";
import {loginWithToken} from "src/actions/sessionActions";

const messages = defineMessages({
  registration_not_available_title: {
    id: 'signup.not_available_title',
    defaultMessage: 'Registration is disabled'
  },
  registration_not_available_desc: {
    id: 'signup.not_available_desc',
    defaultMessage: 'Please contact the site admin to get an account'
  }
});

class OAuth extends Component {
  constructor() {
    super();
  }

  componentWillMount() {
    const parsedHash = queryString.parse(window.location.hash);
    if (parsedHash.token) {
      this.props.loginWithToken(parsedHash.token);
      window.location.hash = '';
    }
  }

  render() {
    const {metadata, session} = this.props;

    if (session.loggedIn) {
      return <Redirect to="/"/>;
    } else if (!metadata.auth.registration_uri) {
      return (
        <ErrorScreen.PageNotFound visual='' title={messages.registration_not_available_title} description={messages.registration_not_available_desc}/>
      );
    } else {
      window.location.replace('/');
      return null;
    }
  }
}

const mapStateToProps = ({session, metadata}) => ({session, metadata});

export default connect(mapStateToProps, {loginWithToken})(OAuth);
