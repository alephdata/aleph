import {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';

import queryString from "query-string";
import { loginWithToken } from "src/actions/sessionActions";


class OAuthScreen extends Component {
  componentDidMount() {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if (parsedHash.token) {
      this.props.loginWithToken(parsedHash.token);
      return null;
    }
  }

  render() {
    const { location } = this.props;
    const query = queryString.parse(location.search);
    const nextPath = query.path || '/';
    window.location.replace(nextPath);
    return null;
  }
}

const mapStateToProps = ({ session }) => ({ session });

OAuthScreen = connect(mapStateToProps, {loginWithToken})(OAuthScreen);
OAuthScreen = withRouter(OAuthScreen);
export default OAuthScreen;
