// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { Component } from 'react';
import { connect } from 'react-redux';

import LoadingScreen from 'components/Screen/LoadingScreen';
import { logout } from 'actions/sessionActions';
import { selectSession } from 'selectors';

class LogoutScreen extends Component {
  componentDidMount() {
    this.props.logout();
  }

  render() {
    const { session } = this.props;
    if (!session.loggedIn && session.logoutRedirect) {
      window.location = session.logoutRedirect;
    }
    return <LoadingScreen {...this.props} />
  }
}

const mapStateToProps = (state) => ({
  session: selectSession(state),
});

export default connect(mapStateToProps, { logout })(LogoutScreen);
