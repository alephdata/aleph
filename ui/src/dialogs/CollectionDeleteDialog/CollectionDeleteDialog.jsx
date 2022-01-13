import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { deleteCollection } from 'actions';
import { Collection } from 'components/common';


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
    const path = collection.casefile ? '/investigations' : '/datasets';
    await this.props.deleteCollection(collection);
    history.push({ pathname: path });
  }

  render() {
    const { collection, intl } = this.props;
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
          defaultMessage="Are you sure you want to delete {collectionLabel} and all contained items?"
          values={{ collectionLabel: <Collection.Label collection={collection} icon={false} /> }}
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
