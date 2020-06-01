import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Alert, Intent, Checkbox } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { triggerCollectionReingest } from 'src/actions';
import { showSuccessToast } from 'src/app/toast';


const messages = defineMessages({
  processing: {
    id: 'collection.reingest.processing',
    defaultMessage: 'Re-ingest started.',
  },
  cancel: {
    id: 'collection.analyze.cancel',
    defaultMessage: 'Cancel',
  },
  confirm: {
    id: 'collection.reingest.confirm',
    defaultMessage: 'Start processing',
  },
  index: {
    id: 'collection.reingest.index',
    defaultMessage: 'Index documents as they are processed.',
  },
});

class CollectionReingestAlert extends Component {
  constructor(props) {
    super(props);
    this.state = { index: true };
    this.onToggleIndex = this.onToggleIndex.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
  }

  onConfirm() {
    const { collection, intl } = this.props;
    this.props.triggerCollectionReingest(collection.id, this.state.index);
    showSuccessToast(intl.formatMessage(messages.processing));
    this.props.toggleAlert();
  }

  onToggleIndex() {
    this.setState((state) => ({ index: !state.index }));
  }

  render() {
    const { intl, isOpen } = this.props;
    return (
      <Alert
        cancelButtonText={intl.formatMessage(messages.cancel)}
        confirmButtonText={intl.formatMessage(messages.confirm)}
        canEscapeKeyCancel
        canOutsideClickCancel
        icon="automatic-updates"
        intent={Intent.DANGER}
        isOpen={isOpen}
        onCancel={this.props.toggleAlert}
        onConfirm={this.onConfirm}
      >
        <p>
          <FormattedMessage
            id="collection.reingest.text"
            defaultMessage="You're about to re-process all documents in this dataset. This might take some time."
          />
        </p>
        <Checkbox
          checked={this.state.index}
          label={intl.formatMessage(messages.index)}
          onChange={this.onToggleIndex}
        />
      </Alert>
    );
  }
}

export default compose(
  connect(null, { triggerCollectionReingest }),
  injectIntl,
)(CollectionReingestAlert);
