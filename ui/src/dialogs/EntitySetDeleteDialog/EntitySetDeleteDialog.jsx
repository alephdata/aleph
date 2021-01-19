import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { deleteEntitySet } from 'actions';
import { showSuccessToast } from 'app/toast';
import getCollectionLink from 'util/getCollectionLink';


const messages = defineMessages({
  button_confirm: {
    id: 'entityset.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'entityset.delete.cancel',
    defaultMessage: 'Cancel',
  },
  success: {
    id: 'entityset.delete.success',
    defaultMessage: 'Successfully deleted {title}',
  },
});


class EntitySetDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  onDelete() {
    const { entitySet, history, intl } = this.props;
    this.props.deleteEntitySet(entitySet.id).then(() => (
      showSuccessToast(intl.formatMessage(messages.success, { title: entitySet.label }))
    ));

    history.push(
      getCollectionLink({ collection: entitySet.collection })
    );
  }

  render() {
    const { intl, entitySet } = this.props;
    const { type } = entitySet;
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
          id="entityset.delete.question"
          defaultMessage="Are you sure you want to delete this {type}?"
          values={{ type }}
        />
      </Alert>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { deleteEntitySet }),
  injectIntl,
)(EntitySetDeleteDialog);
