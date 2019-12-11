import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Alert, Intent, Checkbox } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { triggerCollectionAnalyze } from 'src/actions';
import { showSuccessToast } from 'src/app/toast';


const messages = defineMessages({
  processing: {
    id: 'collection.analyze.processing',
    defaultMessage: 'Re-processing started.',
  },
  cancel: {
    id: 'collection.analyze.cancel',
    defaultMessage: 'Cancel',
  },
  confirm: {
    id: 'collection.analyze.confirm',
    defaultMessage: 'Start processing',
  },
  reset: {
    id: 'collection.analyze.reset',
    defaultMessage: 'Clear index before processing',
  },
});

class CollectionAnalyzeAlert extends Component {
  constructor(props) {
    super(props);
    this.state = { reset: true };
    this.onToggleReset = this.onToggleReset.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
  }

  onConfirm() {
    const { collection, intl } = this.props;
    this.props.triggerCollectionAnalyze(collection.id, this.state.reset);
    showSuccessToast(intl.formatMessage(messages.processing));
    this.props.toggleAlert();
  }

  onToggleReset() {
    this.setState((state) => ({ reset: !state.reset }));
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
            id="collection.analyze.alert.text"
            defaultMessage="Re-processing the dataset will take some time. Start the process only once and allow time for it to complete."
          />
        </p>
        <Checkbox
          checked={this.state.reset}
          label={intl.formatMessage(messages.reset)}
          onChange={this.onToggleReset}
        />
      </Alert>
    );
  }
}

export default compose(
  connect(null, { triggerCollectionAnalyze }),
  injectIntl,
)(CollectionAnalyzeAlert);
