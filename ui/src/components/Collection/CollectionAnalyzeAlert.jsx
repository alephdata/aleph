import React, {Component} from 'react';
import { connect } from "react-redux";
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Alert, Intent } from "@blueprintjs/core";

import { triggerCollectionAnalyze } from "src/actions";
import { showSuccessToast } from "src/app/toast";

const messages = defineMessages({
  processing: {
    id: 'collection.analyze.processing',
    defaultMessage: 'Re-analyzing started.'
  },
  cancel: {
    id: 'collection.analyze.cancel',
    defaultMessage: 'Cancel'
  },
  confirm: {
    id: 'collection.analyze.confirm',
    defaultMessage: 'Start re-analyzing'
  }
});

class CollectionAnalyzeAlert extends Component {
  constructor(props) {
    super(props);
    this.onConfirm = this.onConfirm.bind(this);
  }

  onConfirm() {
    const { collection, intl } = this.props;
    this.props.triggerCollectionAnalyze(collection.id);
    showSuccessToast(intl.formatMessage(messages.processing));
    this.props.toggleAlert();
  }

  render() {
    const { intl, isOpen } = this.props;
    return (
      <Alert cancelButtonText={intl.formatMessage(messages.cancel)}
             confirmButtonText={intl.formatMessage(messages.confirm)}
             canEscapeKeyCancel={true}
             canOutsideClickCancel={true}
             icon="automatic-updates"
             intent={Intent.DANGER}
             isOpen={isOpen}
             onCancel={this.props.toggleAlert}
             onConfirm={this.onConfirm}>
        <p>
          <FormattedMessage id="collection.analyze.alert.text"
                            defaultMessage="Re-analyzing the collection will take some time. Please start the process only once and allow time for it to complete." />
        </p>
      </Alert>
    );
  }
}


CollectionAnalyzeAlert = connect(null, { triggerCollectionAnalyze })(CollectionAnalyzeAlert);
CollectionAnalyzeAlert = injectIntl(CollectionAnalyzeAlert);
export default CollectionAnalyzeAlert;
