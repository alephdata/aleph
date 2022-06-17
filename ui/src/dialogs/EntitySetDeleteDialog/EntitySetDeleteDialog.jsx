// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
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
    const { entitySet, navigate, intl } = this.props;
    this.props.deleteEntitySet(entitySet.id).then(() => (
      showSuccessToast(intl.formatMessage(messages.success, { title: entitySet.label }))
    ));

    navigate(
      getCollectionLink({ collection: entitySet.collection })
    );
  }

  render() {
    const { intl, entitySet } = this.props;
    const { label, type } = entitySet;

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
        <p>
          <strong>
            <FormattedMessage
              id="entityset.delete.question"
              defaultMessage="Are you sure you want to delete {label}?"
              values={{ label }}
            />
          </strong>
        </p>
        {type === 'profile' && (
          <p>
            <FormattedMessage
              id="profile.delete.warning"
              defaultMessage="(Deleting this profile will not delete any of the entities or entity decisions contained within it)"
            />
          </p>
        )}
      </Alert>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { deleteEntitySet }),
  injectIntl,
)(EntitySetDeleteDialog);
