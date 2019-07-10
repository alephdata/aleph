import { Component } from 'react';
import queryString from 'query-string';
import { loginWithToken } from 'src/actions/sessionActions';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';


export class OAuthScreen extends Component {
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
    window.location.replace(nextPath);
    return null;
  }
}

const mapStateToProps = ({ session }) => ({ session });

const mapDispatchToProps = { loginWithToken };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(OAuthScreen);
