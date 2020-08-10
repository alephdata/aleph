import React, { Component } from 'react';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { triggerCollectionXref } from 'actions';
import { showSuccessToast, showWarningToast } from 'app/toast';


const messages = defineMessages({
  title: {
    id: 'collection.xref.title',
    defaultMessage: 'Cross-reference',
  },
  processing: {
    id: 'collection.xref.processing',
    defaultMessage: 'Cross-referencing started.',
  },
  cancel_button: {
    id: 'collection.xref.cancel',
    defaultMessage: 'Cancel',
  },
  confirm_button: {
    id: 'collection.xref.confirm',
    defaultMessage: 'Confirm',
  },
});


class CollectionXrefDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { blocking: false };
    this.onCancel = this.onCancel.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
  }

  onCancel() {
    this.props.toggleDialog();
  }

  async onConfirm() {
    const { collection, intl } = this.props;
    const { blocking } = this.state;
    if (blocking) return;
    this.setState({ blocking: true });
    try {
      await this.props.triggerCollectionXref(collection.id);
      showSuccessToast(intl.formatMessage(messages.processing));
      this.setState({ blocking: false });
      this.props.toggleDialog();
    } catch (e) {
      this.setState({ blocking: false });
      showWarningToast(e.message);
    }
  }

  render() {
    const { intl } = this.props;
    return (
      <Dialog
        icon="comparison"
        className="CollectionXrefDialog"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        title={intl.formatMessage(messages.title)}
      >
        <div className="bp3-dialog-body">
          <FormattedMessage
            id="collection.xref.text"
            defaultMessage="You will now cross-reference this dataset against all other sources. Start this process once and then wait for it to complete."
          />
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              onClick={this.onCancel}
              disabled={this.state.blocking}
              text={intl.formatMessage(messages.cancel_button)}
            />
            <Button
              intent={Intent.PRIMARY}
              onClick={this.onConfirm}
              disabled={this.state.blocking}
              text={intl.formatMessage(messages.confirm_button)}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}

export default compose(
  connect(null, { triggerCollectionXref }),
  injectIntl,
)(CollectionXrefDialog);
