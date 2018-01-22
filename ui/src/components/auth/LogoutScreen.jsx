import React, {PureComponent} from 'react';
import {connect} from 'react-redux'
import {withRouter} from 'react-router';
import {injectIntl} from 'react-intl';

import {logout} from 'src/actions/sessionActions';
import messages from 'src/content/messages';
import {showSuccessToast} from 'src/components/common/Toast';

class LogoutScreen extends PureComponent {
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
