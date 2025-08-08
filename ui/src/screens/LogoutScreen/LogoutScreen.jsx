import { Component } from 'react';
import { connect } from 'react-redux';

import LoadingScreen from '/src/components/Screen/LoadingScreen';
import { logout } from '/src/actions/sessionActions.js';
import { selectSession } from '/src/selectors.js';

class LogoutScreen extends Component {
  componentDidMount() {
    this.props.logout();
  }

  render() {
    const { session } = this.props;
    if (!session.loggedIn && session.logoutRedirect) {
      window.location = session.logoutRedirect;
    }
    return <LoadingScreen {...this.props} />;
  }
}

const mapStateToProps = (state) => ({
  session: selectSession(state),
});

export default connect(mapStateToProps, { logout })(LogoutScreen);
