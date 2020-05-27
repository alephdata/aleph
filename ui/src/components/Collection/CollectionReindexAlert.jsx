import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Alert, Intent, Checkbox } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { triggerCollectionReindex } from 'src/actions';
import { showSuccessToast } from 'src/app/toast';


const messages = defineMessages({
  processing: {
    id: 'collection.reindex.processing',
    defaultMessage: 'Indexing started.',
  },
  cancel: {
    id: 'collection.reindex.cancel',
    defaultMessage: 'Cancel',
  },
  confirm: {
    id: 'collection.reindex.confirm',
    defaultMessage: 'Start indexing',
  },
  flush: {
    id: 'collection.reindex.flush',
    defaultMessage: 'Clear index before re-indexing',
  },
});

class CollectionReindexAlert extends Component {
  constructor(props) {
    super(props);
    this.state = { flush: true };
    this.onToggleFlush = this.onToggleFlush.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
  }

  onConfirm() {
    const { collection, intl } = this.props;
    this.props.triggerCollectionReindex(collection.id, this.state.flush);
    showSuccessToast(intl.formatMessage(messages.processing));
    this.props.toggleAlert();
  }

  onToggleFlush() {
    this.setState((state) => ({ flush: !state.flush }));
  }

  render() {
    const { intl, isOpen } = this.props;
    return (
      <Alert
        cancelButtonText={intl.formatMessage(messages.cancel)}
        confirmButtonText={intl.formatMessage(messages.confirm)}
        canEscapeKeyCancel
        canOutsideClickCancel
        icon="search-template"
        intent={Intent.DANGER}
        isOpen={isOpen}
        onCancel={this.props.toggleAlert}
        onConfirm={this.onConfirm}
      >
        <p>
          <FormattedMessage
            id="collection.analyze.alert.text"
            defaultMessage="You're about to re-index the entities in this dataset. This can be helpful if there are inconsistencies in how the data is presented."
          />
        </p>
        <Checkbox
          checked={this.state.flush}
          label={intl.formatMessage(messages.flush)}
          onChange={this.onToggleFlush}
        />
      </Alert>
    );
  }
}

export default compose(
  connect(null, { triggerCollectionReindex }),
  injectIntl,
)(CollectionReindexAlert);
