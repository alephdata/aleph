import React, {Component} from 'react';
import {connect} from 'react-redux'
import {logout} from "../actions/sessionActions";
import {withRouter} from "react-router";

class LogoutScreen extends Component {
  componentWillMount() {
    const {dispatch, history} = this.props;
    dispatch(logout());
    history.push('/');
  }

  render() {
    return <div>Logout ...</div>;
  }
}

export default connect()(withRouter(LogoutScreen));
