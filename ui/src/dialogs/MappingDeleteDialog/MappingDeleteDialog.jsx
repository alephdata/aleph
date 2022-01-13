import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { deleteCollection } from 'actions';


const messages = defineMessages({
  button_confirm: {
    id: 'mapping.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'mapping.delete.cancel',
    defaultMessage: 'Cancel',
  },
});


class MappingDeleteDialog extends Component {
  render() {
    const { intl } = this.props;
    return (
      <Alert
        isOpen={this.props.isOpen}
        icon="trash"
        intent={Intent.DANGER}
        cancelButtonText={intl.formatMessage(messages.button_cancel)}
        confirmButtonText={intl.formatMessage(messages.button_confirm)}
        onCancel={this.props.toggleDialog}
        onConfirm={this.props.onDelete}
      >
        <FormattedMessage
          id="mapping.delete.question"
          defaultMessage="Are you sure you want to delete this mapping and all generated entities?"
        />
      </Alert>
    );
  }
}

const mapDispatchToProps = { deleteCollection };

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl,
)(MappingDeleteDialog);
