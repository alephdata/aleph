import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Alert, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedPlural, injectIntl } from 'react-intl';
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
    this.state = { blocking: false };
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { entities, history, intl, redirectOnSuccess, toggleDialog } = this.props;
    const { blocking } = this.state;

    if (blocking) return false;

    try {
      this.setState({ blocking: true });
      await Promise.all(
        entities.map(async entity => this.props.deleteEntity(entity)),
      );
      showSuccessToast(intl.formatMessage(messages.delete_success));
      if (redirectOnSuccess) {
        const parent = entities[0]?.getFirst('parent');
        const collection = entities[0]?.collection;
        const pathname = parent ? getEntityLink(parent) : getCollectionLink(collection);

        history.push({
          pathname,
        });
      }
      this.setState({ blocking: false });
      toggleDialog();
    } catch (e) {
      showErrorToast(intl.formatMessage(messages.delete_error));
      this.setState({ blocking: false });
    }
  }

  render() {
    const { entities, intl } = this.props;
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
        <FormattedPlural
          id="entity.delete.question"
          value={entities.length}
          one="Are you sure you want to delete this entity?"
          other="Are you sure you want to delete these entities?"
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
