import React, {Component} from 'react';
import {connect} from 'react-redux'
import {withRouter} from "react-router";
import {injectIntl} from "react-intl";

import {logout} from "actions/sessionActions";
import messages from 'content/messages';
import {showSuccessToast} from "components/common/Toast";

class LogoutScreen extends Component {
  componentWillMount() {
    const {logout, history, intl} = this.props;
    logout();
    showSuccessToast(intl.formatMessage(messages.status.logout_success));
    history.push('/');
  }

  render() {
    return <div>Logout ...</div>;
  }
}

export default connect(null, {logout})(withRouter(injectIntl(LogoutScreen)));
