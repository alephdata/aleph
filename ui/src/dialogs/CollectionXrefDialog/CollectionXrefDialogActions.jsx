import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { showWarningToast } from "src/app/toast";


const messages = defineMessages({
  cancel_button: {
    id: 'collection.xref.cancel_button',
    defaultMessage: 'Cancel',
  },
  confirm_button: {
    id: 'collection.xref.confirm_button',
    defaultMessage: 'Start'
  }
});


class CollectionXrefDialogActions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false
    };
  }

  async onConfirm() {
    const { confirmFn } = this.props;
    const { blocking } = this.state;
    if (blocking) {
      return;
    }
    this.setState({ blocking: true });
    try {
      await confirmFn();
      this.setState({ blocking: false });
    } catch (e) {
      this.setState({ blocking: false });
      showWarningToast(e.message);
    }
  }

  render() {
    const { intl, cancelFn, confirmDisabled } = this.props;
    const { blocking } = this.state;

    return (
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button onClick={cancelFn}
                    disabled={blocking}
                    text={intl.formatMessage(messages.cancel_button)}/>
            <Button intent={Intent.PRIMARY}
                    onClick={() => this.onConfirm()}
                    disabled={confirmDisabled || blocking}
                    text={intl.formatMessage(messages.confirm_button)}/>
          </div>
        </div>
    );
  }
}

CollectionXrefDialogActions = injectIntl(CollectionXrefDialogActions);
export default CollectionXrefDialogActions;
