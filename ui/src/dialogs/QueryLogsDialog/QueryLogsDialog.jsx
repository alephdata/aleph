import React, {Component} from 'react';
import { toString } from 'lodash';
import { connect } from 'react-redux';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import c from 'classnames';

import { updateRole, fetchRole } from 'src/actions';
import { selectSession } from 'src/selectors';
import QueryLogs from "../../components/QueryLogs/QueryLogs";


const messages = defineMessages({
  title: {
    id: 'settings.title',
    defaultMessage: 'Query ',
  },
  save_button: {
    id: 'settings.save',
    defaultMessage: 'Update QUery',
  },
});


class QueryLogsDialog extends Component {

  render() {
    const { intl } = this.props;

    return (
      <Dialog
          icon="cog"
          isOpen={this.props.isOpen}
          onClose={this.props.toggleDialog}
          title={intl.formatMessage(messages.title)}>
        <div className="bp3-dialog-body">
          <QueryLogs
            closeDialog={this.props.toggleDialog}
          />
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    session: selectSession(state),
    role: state.session.role
  };
};

export default connect(mapStateToProps, {fetchRole, updateRole})(injectIntl(QueryLogsDialog));
