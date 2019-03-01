import { Component } from 'react';
import queryString from 'query-string';
import { loginWithToken } from 'src/actions/sessionActions';
import { connectedWIthRouter } from '../../util/enhancers';


const mapStateToProps = ({ session }) => ({ session });


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
    const nextPath = query.path || '/';
    window.location.replace(nextPath);
    return null;
  }
}

export default connectedWIthRouter({
  mapStateToProps,
  mapDispatchToProps: { loginWithToken },
})(OAuthScreen);
