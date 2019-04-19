import React, { PureComponent } from 'react';
import { Dialog } from '@blueprintjs/core/lib/esm/components/dialog/dialog';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { fetchRole, updateRole } from 'src/actions';
import { selectSession } from 'src/selectors';
import QueryLogs from 'src/components/QueryLogs/QueryLogs';


const messages = defineMessages({
  title: {
    id: 'queryLogs.title',
    defaultMessage: 'Search history',
  },
});


class QueryLogsDialog extends PureComponent {
  render() {
    const { intl } = this.props;
    return (
      <Dialog
        icon="history"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        title={intl.formatMessage(messages.title)}
      >
        <div className="bp3-dialog-body">
          <QueryLogs closeDialog={this.props.toggleDialog} />
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = state => ({
  session: selectSession(state),
  role: state.session.role,
});

const mapDispatchToProps = { fetchRole, updateRole };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(QueryLogsDialog);
