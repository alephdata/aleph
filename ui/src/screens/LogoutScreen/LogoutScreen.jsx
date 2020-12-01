import { Component } from 'react';
import { connect } from 'react-redux';

import LoadingScreen from 'components/Screen/LoadingScreen';
import { logout } from 'actions/sessionActions';
import { selectSession, selectMetadata } from 'selectors';

class LogoutScreen extends Component {
  componentDidMount() {
    this.props.logout();
  }

  render() {
    const { session, metadata } = this.props;
    if (session.loggedIn) {
      return <LoadingScreen {...this.props} />
    }
    window.location = metadata.auth.logout;
  }
}

const mapStateToProps = (state) => ({
  session: selectSession(state),
  metadata: selectMetadata(state),
});

export default connect(mapStateToProps, { logout })(LogoutScreen);
