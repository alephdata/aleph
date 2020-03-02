import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Alert, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { deleteEntity } from 'src/actions';
import { showErrorToast, showSuccessToast } from 'src/app/toast';
import getCollectionLink from 'src/util/getCollectionLink';
import getEntityLink from 'src/util/getEntityLink';

const messages = defineMessages({
  button_confirm: {
    id: 'entity.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'entity.delete.cancel',
    defaultMessage: 'Cancel',
  },
  delete_success: {
    id: 'entity.delete.success',
    defaultMessage: 'Successfully deleted',
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
    const { entities, history, intl, redirectOnSuccess } = this.props;
    try {
      await Promise.all(
        entities.map(async entity => this.props.deleteEntity(entity)),
      );
      showSuccessToast(intl.formatMessage(messages.delete_success));
      if (redirectOnSuccess) {
        const parent = entities[0]?.getFirst('parent');
        const collection = entities[0]?.collection;

        if (parent) {
          history.push({
            pathname: getEntityLink(parent),
          });
        } else {
          history.push({
            pathname: getCollectionLink(collection),
          });
        }
      }
    } catch (e) {
      showErrorToast(intl.formatMessage(messages.delete_error));
    }
  }

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

export default compose(
  withRouter,
  connect(null, { deleteEntity }),
  injectIntl,
)(EntityDeleteDialog);
