import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Dialog} from '@blueprintjs/core/lib/esm/components/dialog/dialog';
import {defineMessages, injectIntl} from 'react-intl';

import {fetchRole, updateRole} from 'src/actions';
import {selectSession} from 'src/selectors';
import QueryLogs from "../../components/QueryLogs/QueryLogs";


const messages = defineMessages({
  title: {
    id: 'queryLogs.title',
    defaultMessage: 'Search history',
  },
});


class QueryLogsDialog extends Component {

  render() {
    const { intl } = this.props;

    return (
      <Dialog
        icon="history"
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

const mapStateToProps = (state) => {
  return {
    session: selectSession(state),
    role: state.session.role
  };
};

export default connect(mapStateToProps, {fetchRole, updateRole})(injectIntl(QueryLogsDialog));
