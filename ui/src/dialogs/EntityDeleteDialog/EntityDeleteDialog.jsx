import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { deleteEntity } from 'src/actions';

const messages = defineMessages({
  button_confirm: {
    id: 'entity.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'entity.delete.cancel',
    defaultMessage: 'Cancel',
  },
  delete_error: {
    id: 'entity.delete.error',
    defaultMessage: 'An error occured while attempting to delete this entity.',
  },
});

export class EntityDeleteDialog extends Component {
  constructor(props) {
    super(props);
    // this.state = { blocking: false };
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { entities } = this.props;
    await Promise.all(
      entities.map(async entity => this.props.deleteEntity(entity)),
    );
  }

  render() {
    const { intl } = this.props;
    return (
      <Alert
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        icon="trash"
        intent={Intent.DANGER}
        cancelButtonText={intl.formatMessage(messages.button_cancel)}
        confirmButtonText={intl.formatMessage(messages.button_confirm)}
        onCancel={this.props.toggleDialog}
        onConfirm={this.onDelete}
      >
        <FormattedMessage
          id="entity.delete.question"
          defaultMessage="Are you sure you want to delete this entity?"
        />
      </Alert>
    );
  }
}

export default compose(connect(null, { deleteEntity }), injectIntl)(EntityDeleteDialog);
