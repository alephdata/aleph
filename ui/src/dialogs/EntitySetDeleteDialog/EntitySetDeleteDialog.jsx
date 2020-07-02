import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { deleteEntitySet } from 'src/actions';
import getCollectionLink from 'src/util/getCollectionLink';


const messages = defineMessages({
  button_confirm: {
    id: 'entityset.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'entityset.delete.cancel',
    defaultMessage: 'Cancel',
  },
});


class EntitySetDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { entitySet, history } = this.props;
    await this.props.deleteEntitySet(entitySet.id);
    history.push({
      pathname: `${getCollectionLink(entitySet.collection)}#mode=${entitySet.type}s`,
    });
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

const mapDispatchToProps = { deleteEntitySet };

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl,
)(EntitySetDeleteDialog);
