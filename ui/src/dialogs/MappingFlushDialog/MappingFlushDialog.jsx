import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import { deleteCollection } from 'actions';

const messages = defineMessages({
  button_confirm: {
    id: 'mapping.flush.confirm',
    defaultMessage: 'Remove',
  },
  button_cancel: {
    id: 'mapping.flush.cancel',
    defaultMessage: 'Cancel',
  },
});

class MappingFlushDialog extends Component {
  render() {
    const { intl } = this.props;
    return (
      <Alert
        isOpen={this.props.isOpen}
        icon="delete"
        intent={Intent.DANGER}
        cancelButtonText={intl.formatMessage(messages.button_cancel)}
        confirmButtonText={intl.formatMessage(messages.button_confirm)}
        onCancel={this.props.toggleDialog}
        onConfirm={this.props.onFlush}
      >
        <FormattedMessage
          id="mapping.flush.question"
          defaultMessage="Are you sure you want to remove entities generated using this mapping?"
        />
      </Alert>
    );
  }
}

const mapDispatchToProps = { deleteCollection };

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl
)(MappingFlushDialog);
