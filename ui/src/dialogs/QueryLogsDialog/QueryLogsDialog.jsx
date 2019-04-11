import React, { PureComponent } from 'react';
import { Dialog } from '@blueprintjs/core/lib/esm/components/dialog/dialog';
import { defineMessages } from 'react-intl';

import { fetchRole, updateRole } from 'src/actions';
import { selectSession } from 'src/selectors';
import QueryLogs from 'src/components/QueryLogs/QueryLogs';
import { translatableConnected } from 'src/util/enhancers';


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

export default translatableConnected({
  mapStateToProps,
  mapDispatchToProps: { fetchRole, updateRole },
})(QueryLogsDialog);
