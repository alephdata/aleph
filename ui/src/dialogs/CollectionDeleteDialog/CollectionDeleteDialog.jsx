import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { deleteCollection } from 'src/actions';


const messages = defineMessages({
  button_confirm: {
    id: 'collection.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'collection.delete.cancel',
    defaultMessage: 'Cancel',
  },
});


class CollectionDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { collection, history } = this.props;
    const path = collection.casefile ? '/cases' : '/datasets';
    await this.props.deleteCollection(collection);
    history.push({ pathname: path });
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
          id="collection.delete.question"
          defaultMessage="Are you sure you want to delete this dataset and all contained items?"
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
)(CollectionDeleteDialog);
