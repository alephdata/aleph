import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';

import { logout } from 'src/actions/sessionActions';
import { showSuccessToast } from 'src/app/toast';

const messages = defineMessages({
  success: {
    id: 'logout.success',
    defaultMessage: 'Logout successful',
  },
});

class LogoutScreen extends Component {
  componentDidMount() {
    const { history, intl } = this.props;
    this.props.logout();
    showSuccessToast(intl.formatMessage(messages.success));
    history.push('/');
  }

  render() {
    return null;
  }
}

export default connect(null, { logout })(withRouter(injectIntl(LogoutScreen)));
